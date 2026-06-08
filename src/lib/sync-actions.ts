"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { hasGoogleCredentials } from "@/lib/google/auth";
import { fetchGa4Summary } from "@/lib/google/ga4";
import { fetchSearchConsoleSummary } from "@/lib/google/searchConsole";
import type { Json as DbJson } from "@/lib/database.types";

export interface SyncOutcome {
  sourceKey: string;
  name: string;
  ok: boolean;
  message: string;
}

export interface SyncState {
  ran?: boolean;
  error?: string;
  outcomes?: SyncOutcome[];
}

type Supabase = Awaited<ReturnType<typeof createClient>>;
type Json = Record<string, unknown>;

const SYNCABLE = new Set(["ga4", "gsc"]);

async function getCompanyId(supabase: Supabase): Promise<string | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase
    .from("companies")
    .select("id")
    .eq("owner_id", user.id)
    .maybeSingle();
  return data?.id ?? null;
}

interface SourceRow {
  source_key: string;
  name: string;
  config: Json;
}

/** 1ソース分の同期（取得→data_sources 更新）。失敗してもthrowせず outcome を返す */
async function syncOne(
  supabase: Supabase,
  companyId: string,
  row: SourceRow,
): Promise<SyncOutcome> {
  const base = { sourceKey: row.source_key, name: row.name };
  try {
    let metrics: { label: string; value: string }[];
    const config: Json = { ...row.config };

    if (row.source_key === "ga4") {
      const propertyId = String(row.config.propertyId ?? "").trim();
      if (!propertyId) {
        return { ...base, ok: false, message: "GA4 プロパティID（数値）を設定してください" };
      }
      const s = await fetchGa4Summary(propertyId);
      metrics = [
        { label: "PV", value: s.pv.toLocaleString("ja-JP") },
        { label: "UU", value: s.uu.toLocaleString("ja-JP") },
        { label: "CV", value: s.cv.toLocaleString("ja-JP") },
      ];
      config.raw = s;
    } else if (row.source_key === "gsc") {
      const siteUrl = String(row.config.siteUrl ?? row.config.value ?? "").trim();
      if (!siteUrl) {
        return { ...base, ok: false, message: "Search Console のサイトURLを設定してください" };
      }
      const s = await fetchSearchConsoleSummary(siteUrl);
      metrics = [
        { label: "検索順位", value: s.position.toFixed(1) },
        { label: "CTR", value: `${s.ctr}%` },
      ];
      config.raw = s;
    } else {
      return { ...base, ok: false, message: "このソースはまだ自動取得に対応していません" };
    }

    config.lastError = null;

    const { error } = await supabase
      .from("data_sources")
      .update({
        metrics,
        status: "connected",
        last_sync: new Date().toISOString(),
        config: config as DbJson,
      })
      .eq("company_id", companyId)
      .eq("source_key", row.source_key);

    if (error) {
      return { ...base, ok: false, message: "保存に失敗しました" };
    }
    return { ...base, ok: true, message: "同期しました" };
  } catch (e) {
    const message = e instanceof Error ? e.message : "取得に失敗しました";
    // エラーを config に記録（ステータスは保持）
    await supabase
      .from("data_sources")
      .update({ config: { ...row.config, lastError: message } as DbJson })
      .eq("company_id", companyId)
      .eq("source_key", row.source_key);
    return { ...base, ok: false, message };
  }
}

/** 「今すぐ同期」: ga4 / gsc をまとめて同期 */
export async function syncAllAction(
  _prev: SyncState,
  _formData: FormData,
): Promise<SyncState> {
  if (!hasGoogleCredentials()) {
    return {
      ran: false,
      error:
        "Google サービスアカウントの認証情報が未設定です。.env.local に GOOGLE_SERVICE_ACCOUNT_EMAIL / GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY を設定してください。",
    };
  }

  const supabase = await createClient();
  const companyId = await getCompanyId(supabase);
  if (!companyId) return { ran: false, error: "ログインが必要です" };

  const { data: rows } = await supabase
    .from("data_sources")
    .select("source_key, name, config")
    .eq("company_id", companyId)
    .order("sort", { ascending: true });

  const targets = (rows ?? []).filter((r) => SYNCABLE.has(r.source_key));
  const outcomes: SyncOutcome[] = [];
  for (const r of targets) {
    outcomes.push(
      await syncOne(supabase, companyId, {
        source_key: r.source_key,
        name: r.name,
        config: (r.config as Json) ?? {},
      }),
    );
  }

  revalidatePath("/sources");
  revalidatePath("/");
  return { ran: true, outcomes };
}

/** GA4 プロパティID / GSC サイトURL を保存して即同期 */
export async function saveAndSyncAction(
  _prev: SyncState,
  formData: FormData,
): Promise<SyncState> {
  const sourceKey = String(formData.get("sourceKey") ?? "");
  if (!SYNCABLE.has(sourceKey)) return { ran: false, error: "不正なソースです" };

  const supabase = await createClient();
  const companyId = await getCompanyId(supabase);
  if (!companyId) return { ran: false, error: "ログインが必要です" };

  const { data: row } = await supabase
    .from("data_sources")
    .select("source_key, name, config")
    .eq("company_id", companyId)
    .eq("source_key", sourceKey)
    .maybeSingle();
  if (!row) return { ran: false, error: "ソースが見つかりません" };

  const config: Json = { ...((row.config as Json) ?? {}) };
  if (sourceKey === "ga4") {
    const propertyId = String(formData.get("propertyId") ?? "").replace(/[^0-9]/g, "");
    if (!propertyId) return { ran: false, error: "プロパティID（数値）を入力してください" };
    config.propertyId = propertyId;
  } else if (sourceKey === "gsc") {
    const siteUrl = String(formData.get("siteUrl") ?? "").trim();
    if (!siteUrl) return { ran: false, error: "サイトURLを入力してください" };
    config.siteUrl = siteUrl;
  }

  await supabase
    .from("data_sources")
    .update({ config: config as DbJson })
    .eq("company_id", companyId)
    .eq("source_key", sourceKey);

  if (!hasGoogleCredentials()) {
    return {
      ran: true,
      outcomes: [
        {
          sourceKey,
          name: String(row.name),
          ok: false,
          message:
            "設定を保存しました。Google 認証情報（.env.local）を設定すると同期できます。",
        },
      ],
    };
  }

  const outcome = await syncOne(supabase, companyId, {
    source_key: sourceKey,
    name: String(row.name),
    config,
  });

  revalidatePath("/sources");
  revalidatePath("/");
  return { ran: true, outcomes: [outcome] };
}

// 認証情報の有無をクライアントへ伝えるためのヘルパー（Server Action として呼べる）
export async function checkGoogleCredentials(): Promise<boolean> {
  return hasGoogleCredentials();
}

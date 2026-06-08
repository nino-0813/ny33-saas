"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  getAccessTokenForCompany,
  hasOAuthConfig,
  deleteConnection,
} from "@/lib/google/oauth";
import { fetchGa4Summary } from "@/lib/google/ga4";
import { fetchSearchConsoleSummary } from "@/lib/google/searchConsole";
import { scoreGa4, scoreGsc } from "@/lib/measure/score";
import { statusFromScore } from "@/lib/measure/shared";
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
type Cfg = Record<string, unknown>;

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
  config: Cfg;
}

/** 1ソース分の同期（失敗してもthrowせず outcome を返す） */
async function syncOne(
  supabase: Supabase,
  companyId: string,
  accessToken: string,
  row: SourceRow,
): Promise<SyncOutcome> {
  const base = { sourceKey: row.source_key, name: row.name };
  try {
    let metrics: { label: string; value: string }[];
    const config: Cfg = { ...row.config };
    // 実データから算出するチェックスコア（ga4→access, gsc→seo）
    let derived: { checkKey: string; score: number; note: string } | null = null;

    if (row.source_key === "ga4") {
      const propertyId = String(row.config.propertyId ?? "").trim();
      if (!propertyId) {
        return { ...base, ok: false, message: "GA4 プロパティを選択してください" };
      }
      const s = await fetchGa4Summary(accessToken, propertyId);
      metrics = [
        { label: "PV", value: s.pv.toLocaleString("ja-JP") },
        { label: "UU", value: s.uu.toLocaleString("ja-JP") },
        { label: "CV", value: s.cv.toLocaleString("ja-JP") },
      ];
      config.raw = s;
      derived = { checkKey: "access", score: scoreGa4(s), note: "GA4 の実データから算出" };
    } else if (row.source_key === "gsc") {
      const siteUrl = String(row.config.siteUrl ?? row.config.value ?? "").trim();
      if (!siteUrl) {
        return { ...base, ok: false, message: "Search Console のサイトを選択してください" };
      }
      const s = await fetchSearchConsoleSummary(accessToken, siteUrl);
      metrics = [
        { label: "検索順位", value: s.position.toFixed(1) },
        { label: "CTR", value: `${s.ctr}%` },
      ];
      config.raw = s;
      derived = { checkKey: "seo", score: scoreGsc(s), note: "Search Console の実データから算出" };
    } else {
      return { ...base, ok: false, message: "未対応のソースです" };
    }

    config.lastError = null;
    const now = new Date().toISOString();

    const { error } = await supabase
      .from("data_sources")
      .update({
        metrics,
        status: "connected",
        last_sync: now,
        config: config as DbJson,
      })
      .eq("company_id", companyId)
      .eq("source_key", row.source_key);

    if (error) return { ...base, ok: false, message: "保存に失敗しました" };

    // 実データからチェックスコアを check_results に保存（ダッシュボード/一覧/詳細へ反映）
    if (derived) {
      await supabase.from("check_results").upsert(
        {
          company_id: companyId,
          check_key: derived.checkKey,
          score: derived.score,
          status: statusFromScore(derived.score),
          metrics: metrics as unknown as DbJson,
          note: derived.note,
          measured_at: now,
        },
        { onConflict: "company_id,check_key" },
      );
    }

    return { ...base, ok: true, message: "同期しました" };
  } catch (e) {
    const message = e instanceof Error ? e.message : "取得に失敗しました";
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
  if (!hasOAuthConfig()) {
    return {
      ran: false,
      error: "Google 連携が未設定です（運営側の設定をご確認ください）。",
    };
  }

  const supabase = await createClient();
  const companyId = await getCompanyId(supabase);
  if (!companyId) return { ran: false, error: "ログインが必要です" };

  const accessToken = await getAccessTokenForCompany(companyId);
  if (!accessToken) {
    return { ran: false, error: "Google と連携してください。" };
  }

  const { data: rows } = await supabase
    .from("data_sources")
    .select("source_key, name, config")
    .eq("company_id", companyId)
    .order("sort", { ascending: true });

  const targets = (rows ?? []).filter((r) => SYNCABLE.has(r.source_key));
  const outcomes: SyncOutcome[] = [];
  for (const r of targets) {
    outcomes.push(
      await syncOne(supabase, companyId, accessToken, {
        source_key: r.source_key,
        name: r.name,
        config: (r.config as Cfg) ?? {},
      }),
    );
  }

  revalidatePath("/sources");
  revalidatePath("/");
  return { ran: true, outcomes };
}

/** ドロップダウンで選んだ GA4 プロパティ / GSC サイトを保存して即同期 */
export async function selectAndSyncAction(
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

  const config: Cfg = { ...((row.config as Cfg) ?? {}) };
  const value = String(formData.get("value") ?? "").trim();
  if (!value) return { ran: false, error: "項目を選択してください" };
  if (sourceKey === "ga4") config.propertyId = value.replace(/[^0-9]/g, "");
  else config.siteUrl = value;

  await supabase
    .from("data_sources")
    .update({ config: config as DbJson })
    .eq("company_id", companyId)
    .eq("source_key", sourceKey);

  const accessToken = await getAccessTokenForCompany(companyId);
  if (!accessToken) {
    return {
      ran: true,
      outcomes: [
        { sourceKey, name: String(row.name), ok: false, message: "Google と連携してください。" },
      ],
    };
  }

  const outcome = await syncOne(supabase, companyId, accessToken, {
    source_key: sourceKey,
    name: String(row.name),
    config,
  });

  revalidatePath("/sources");
  revalidatePath("/");
  return { ran: true, outcomes: [outcome] };
}

/** Google 連携を解除 */
export async function disconnectGoogleAction(): Promise<void> {
  const supabase = await createClient();
  const companyId = await getCompanyId(supabase);
  if (!companyId) return;

  await deleteConnection(companyId);
  // GA4 / GSC のステータスと取得値をリセット
  for (const key of ["ga4", "gsc"]) {
    await supabase
      .from("data_sources")
      .update({ status: "disconnected", metrics: [], config: {} as DbJson, last_sync: null })
      .eq("company_id", companyId)
      .eq("source_key", key);
  }
  // 実データから算出したスコアも削除（サンプル表示に戻す）
  await supabase
    .from("check_results")
    .delete()
    .eq("company_id", companyId)
    .in("check_key", ["access", "seo"]);
  revalidatePath("/sources");
  revalidatePath("/");
}

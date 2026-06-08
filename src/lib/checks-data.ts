import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { CheckStatus, Priority, SubMetric } from "@/lib/webdock";

/** チェック → 実データのソース（連携済みなら実値を使う） */
const SOURCE_BY_CHECK: Record<string, string> = {
  access: "ga4",
  seo: "gsc",
};

export interface CheckRealData {
  /** 実データ取得元の表示名（あれば、連携導線用） */
  sourceName?: string;
  /** 実データが利用可能か（= 実際に同期済み） */
  isReal: boolean;
  /** 実データのサブ指標（isReal=true のとき） */
  subMetrics?: SubMetric[];
  lastSync?: string | null;
}

function fmtSync(ts: string | null | undefined): string | null {
  if (!ts) return null;
  const d = new Date(ts);
  const p = (x: number) => String(x).padStart(2, "0");
  return `${d.getFullYear()}/${p(d.getMonth() + 1)}/${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

/**
 * チェックの実データを取得。対応ソースが「実際に同期済み」(config.raw あり) なら
 * data_sources.metrics を実サブ指標として返す。未連携/サンプル時は isReal=false。
 */
export async function getCheckRealData(
  companyId: string,
  checkId: string,
): Promise<CheckRealData> {
  const sourceKey = SOURCE_BY_CHECK[checkId];
  if (!sourceKey) return { isReal: false };

  const supabase = await createClient();
  const { data } = await supabase
    .from("data_sources")
    .select("status, metrics, last_sync, name, config")
    .eq("company_id", companyId)
    .eq("source_key", sourceKey)
    .maybeSingle();

  const sourceName = data?.name ?? undefined;
  const metrics = (data?.metrics as { label: string; value: string }[]) ?? [];
  const cfg = (data?.config as Record<string, unknown>) ?? {};
  const synced = Boolean(cfg.raw); // 実 API 同期でのみ付与される

  if (data?.status === "connected" && synced && metrics.length > 0) {
    return {
      isReal: true,
      sourceName,
      subMetrics: metrics.map((m) => ({ label: m.label, value: m.value })),
      lastSync: fmtSync(data.last_sync),
    };
  }
  return { isReal: false, sourceName };
}

/* ============================================================
 * 実測結果（PageSpeed / SSL など、check_results テーブル）
 * ========================================================== */

export interface MeasuredResult {
  score: number;
  status: CheckStatus;
  subMetrics: SubMetric[];
  note: string;
  measuredAt: string | null;
}

/** 1チェックの実測結果（無ければ null） */
export async function getMeasuredResult(
  companyId: string,
  checkId: string,
): Promise<MeasuredResult | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("check_results")
    .select("score, status, metrics, note, measured_at")
    .eq("company_id", companyId)
    .eq("check_key", checkId)
    .maybeSingle();
  if (!data) return null;
  return {
    score: data.score,
    status: data.status as CheckStatus,
    subMetrics: (data.metrics as unknown as SubMetric[]) ?? [],
    note: data.note,
    measuredAt: fmtSync(data.measured_at),
  };
}

export type MeasuredMap = Map<string, { score: number; status: CheckStatus }>;

/* ============================================================
 * AI診断（ai_diagnoses テーブル）
 * ========================================================== */

export interface AiDiagnosis {
  summary: string;
  goodPoints: string[];
  improvePoints: string[];
  actions: { text: string; priority: Priority }[];
  model: string;
  createdAt: string | null;
}

export async function getAiDiagnosis(
  companyId: string,
  checkId: string,
): Promise<AiDiagnosis | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("ai_diagnoses")
    .select("summary, good_points, improve_points, actions, model, created_at")
    .eq("company_id", companyId)
    .eq("check_key", checkId)
    .maybeSingle();
  if (!data) return null;
  return {
    summary: data.summary,
    goodPoints: (data.good_points as unknown as string[]) ?? [],
    improvePoints: (data.improve_points as unknown as string[]) ?? [],
    actions:
      (data.actions as unknown as { text: string; priority: Priority }[]) ?? [],
    model: data.model,
    createdAt: fmtSync(data.created_at),
  };
}

/** 全チェックの実測スコア/状態マップ（一覧の上書き用・ログイン会社を解決） */
export async function getMeasuredMap(): Promise<MeasuredMap> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return new Map();
  const { data: company } = await supabase
    .from("companies")
    .select("id")
    .eq("owner_id", user.id)
    .maybeSingle();
  if (!company) return new Map();

  const { data } = await supabase
    .from("check_results")
    .select("check_key, score, status")
    .eq("company_id", company.id);
  return new Map(
    (data ?? []).map((r) => [
      r.check_key,
      { score: r.score, status: r.status as CheckStatus },
    ]),
  );
}

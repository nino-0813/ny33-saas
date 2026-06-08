import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { SubMetric } from "@/lib/webdock";

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

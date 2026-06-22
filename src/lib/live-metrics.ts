import "server-only";
import { createClient } from "@/lib/supabase/server";

export interface LiveMetrics {
  connected: boolean;
  ga4?: { pv: number; uu: number; cv: number };
  gsc?: { position: number; ctr: number; clicks: number; impressions: number };
  lastSync?: string;
}

/**
 * 同期済みのGA4/Search Consoleの実数値を data_sources.config.raw から読む。
 * 同期スコア算出時に保存された生サマリを利用する（API再取得はしない）。
 */
export async function getLiveMetrics(): Promise<LiveMetrics> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { connected: false };

  const { data: company } = await supabase
    .from("companies")
    .select("id")
    .eq("owner_id", user.id)
    .maybeSingle();
  if (!company) return { connected: false };

  const { data: rows } = await supabase
    .from("data_sources")
    .select("source_key, config, status, last_sync")
    .eq("company_id", company.id)
    .in("source_key", ["ga4", "gsc"]);

  if (!rows || rows.length === 0) return { connected: false };

  const result: LiveMetrics = { connected: false };
  for (const row of rows) {
    if (row.status !== "connected") continue;
    const raw = (row.config as { raw?: Record<string, number> } | null)?.raw;
    if (!raw) continue;
    if (row.source_key === "ga4") {
      result.ga4 = {
        pv: Number(raw.pv ?? 0),
        uu: Number(raw.uu ?? 0),
        cv: Number(raw.cv ?? 0),
      };
      result.connected = true;
    } else if (row.source_key === "gsc") {
      result.gsc = {
        position: Number(raw.position ?? 0),
        ctr: Number(raw.ctr ?? 0),
        clicks: Number(raw.clicks ?? 0),
        impressions: Number(raw.impressions ?? 0),
      };
      result.connected = true;
    }
    if (row.last_sync) result.lastSync = row.last_sync;
  }
  return result;
}

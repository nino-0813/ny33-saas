import "server-only";
import { createClient } from "@/lib/supabase/server";
import { getAccessTokenForCompany } from "@/lib/google/oauth";
import { fetchGa4Funnel, fetchGa4Events } from "@/lib/google/ga4";
import { fetchSearchConsoleSummary } from "@/lib/google/searchConsole";
import type { FunnelStageInput } from "@/components/funnel/FunnelBoard";

export interface FunnelResult {
  connected: boolean;
  stages?: FunnelStageInput[];
  purchaseMeasured?: boolean; // 購買(purchase/キーイベント)が計測されているか
}

interface RawSignals {
  impressions: number;
  ctr: number; // 0..1
  sessions: number;
  totalUsers: number;
  newUsers: number;
  engagedSessions: number;
  keyEvents: number;
  viewItem: number;
  beginCheckout: number;
  purchase: number;
  hasPurchaseEvent: boolean;
}

const FLOOR = 0.08; // 帯が完全に消えないよう下限
const clamp = (x: number) => Math.max(FLOOR, Math.min(1, x));

/**
 * 実データ → マインドフロー7段階の「通過率(健全度 0..1)」。
 * 各段階を最も関連する指標 ÷ 目安値 で評価する（業種横断のヒューリスティック）。
 * 目安値はチューニング可能な定数として明示しておく。
 */
export function computeStages(s: RawSignals): {
  stages: FunnelStageInput[];
  purchaseMeasured: boolean;
} {
  const awareness = clamp(s.impressions / 1500); // 認知: 検索表示の量
  const interest = clamp(s.ctr / 0.06); // 興味: CTR（目安6%）
  const action = clamp(
    s.sessions > 0 ? s.engagedSessions / s.sessions / 0.55 : 0,
  ); // 行動: エンゲージ率（目安55%）
  const comparison = clamp(
    s.sessions > 0 ? s.viewItem / s.sessions / 0.35 : 0,
  ); // 比較: 1セッションあたり商品閲覧（目安35%）

  // 購買: 購入が計測されていれば begin_checkout→purchase の通過率。
  // 計測が無い/0なら大きな穴として低スコア。
  let purchase: number;
  const purchaseMeasured = s.hasPurchaseEvent || s.keyEvents > 0;
  const conversions = s.purchase || s.keyEvents;
  if (purchaseMeasured && conversions > 0 && s.beginCheckout > 0) {
    purchase = clamp(conversions / s.beginCheckout / 0.4);
  } else if (s.beginCheckout > 0) {
    purchase = 0.15; // 手続きは始まるのに購入が計測/発生していない
  } else {
    purchase = clamp(s.sessions > 0 ? s.beginCheckout / s.sessions / 0.05 : 0);
  }

  const returning = Math.max(0, s.totalUsers - s.newUsers);
  const returnRatio = s.totalUsers > 0 ? returning / s.totalUsers : 0;
  const usage = clamp(returnRatio / 0.2); // 利用: リピート率（目安20%）
  const loyalty = clamp(returnRatio / 0.35); // 愛情: ファン化（目安35%・将来口コミ/LINE加味）

  return {
    purchaseMeasured,
    stages: [
      { key: "awareness", rate: awareness },
      { key: "interest", rate: interest },
      { key: "action", rate: action },
      { key: "comparison", rate: comparison },
      { key: "purchase", rate: purchase },
      { key: "usage", rate: usage },
      { key: "loyalty", rate: loyalty },
    ],
  };
}

/** ログイン会社のGA4/GSCから、ファネル7段階の通過率を算出する */
export async function getFunnelData(): Promise<FunnelResult> {
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

  const { data: ga4Src } = await supabase
    .from("data_sources")
    .select("config")
    .eq("company_id", company.id)
    .eq("source_key", "ga4")
    .maybeSingle();
  const { data: gscSrc } = await supabase
    .from("data_sources")
    .select("config")
    .eq("company_id", company.id)
    .eq("source_key", "gsc")
    .maybeSingle();

  const propertyId = String(
    (ga4Src?.config as { propertyId?: string } | null)?.propertyId ?? "",
  ).trim();
  const siteUrl = String(
    (gscSrc?.config as { siteUrl?: string; value?: string } | null)?.siteUrl ??
      (gscSrc?.config as { value?: string } | null)?.value ??
      "",
  ).trim();

  const token = await getAccessTokenForCompany(company.id);
  if (!token || !propertyId) return { connected: false };

  try {
    const [metrics, events, gsc] = await Promise.all([
      fetchGa4Funnel(token, propertyId),
      fetchGa4Events(token, propertyId),
      siteUrl
        ? fetchSearchConsoleSummary(token, siteUrl).catch(() => null)
        : Promise.resolve(null),
    ]);

    const ev = new Map(events.map((e) => [e.name, e.count]));
    const { stages, purchaseMeasured } = computeStages({
      impressions: gsc?.impressions ?? 0,
      ctr: gsc ? gsc.ctr / 100 : 0, // fetchSearchConsoleSummary は % で返す
      sessions: metrics.sessions,
      totalUsers: metrics.totalUsers,
      newUsers: metrics.newUsers,
      engagedSessions: metrics.engagedSessions,
      keyEvents: metrics.keyEvents,
      viewItem: ev.get("view_item") ?? 0,
      beginCheckout: ev.get("begin_checkout") ?? 0,
      purchase: ev.get("purchase") ?? 0,
      hasPurchaseEvent: ev.has("purchase"),
    });

    return { connected: true, stages, purchaseMeasured };
  } catch {
    return { connected: false };
  }
}

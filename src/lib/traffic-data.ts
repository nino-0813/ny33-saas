import "server-only";
import { createClient } from "@/lib/supabase/server";
import { getAccessTokenForCompany } from "@/lib/google/oauth";
import {
  fetchGa4Channels,
  fetchGa4Events,
  type Ga4Channel,
} from "@/lib/google/ga4";
import { suggestKeyEvents, type CvAssist } from "@/lib/cv-assist";

export type TrafficState =
  | { status: "not-connected" }
  | { status: "no-property" }
  | { status: "error"; message: string }
  | {
      status: "ok";
      channels: Ga4Channel[];
      propertyLabel: string;
      cvAssist?: CvAssist;
    };

/** ログイン会社のGA4から、流入元別データを取得する */
export async function getTrafficBreakdown(): Promise<TrafficState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { status: "not-connected" };

  const { data: company } = await supabase
    .from("companies")
    .select("id")
    .eq("owner_id", user.id)
    .maybeSingle();
  if (!company) return { status: "not-connected" };

  // GA4 の連携設定（data_sources の ga4 行に propertyId が入る）
  const { data: ga4Source } = await supabase
    .from("data_sources")
    .select("name, config, status")
    .eq("company_id", company.id)
    .eq("source_key", "ga4")
    .maybeSingle();

  const accessToken = await getAccessTokenForCompany(company.id);
  if (!accessToken) return { status: "not-connected" };

  const propertyId = String(
    (ga4Source?.config as { propertyId?: string } | null)?.propertyId ?? "",
  ).trim();
  if (!propertyId) return { status: "no-property" };

  try {
    const channels = await fetchGa4Channels(accessToken, propertyId);

    // CVが全く取れていない場合のみ、発生イベントからキーイベント候補を提案する
    let cvAssist: CvAssist | undefined;
    const totalCv = channels.reduce((s, c) => s + c.conversions, 0);
    if (totalCv === 0) {
      try {
        const events = await fetchGa4Events(accessToken, propertyId);
        cvAssist = suggestKeyEvents(events);
      } catch {
        // イベント取得失敗は致命的ではない（アシストを出さないだけ）
      }
    }

    return {
      status: "ok",
      channels,
      propertyLabel: ga4Source?.name ?? "GA4",
      cvAssist,
    };
  } catch (error) {
    return {
      status: "error",
      message:
        error instanceof Error ? error.message : "流入データの取得に失敗しました。",
    };
  }
}

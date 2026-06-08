import "server-only";
import { translateGoogleError } from "./ga4";

export interface SearchConsoleSummary {
  position: number; // 平均掲載順位
  ctr: number; // クリック率（%）
  clicks: number;
  impressions: number;
}

export interface SearchConsoleSite {
  siteUrl: string;
  permissionLevel: string;
}

/** n日前（YYYY-MM-DD） */
function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

interface SearchAnalyticsResponse {
  rows?: { clicks?: number; impressions?: number; ctr?: number; position?: number }[];
  error?: { message?: string };
}

/** Search Console API で直近28日（3〜31日前）の平均順位 / CTR / クリック / 表示回数 */
export async function fetchSearchConsoleSummary(
  accessToken: string,
  siteUrl: string,
): Promise<SearchConsoleSummary> {
  const site = siteUrl.trim();
  if (!site) throw new Error("サイトURLが設定されていません");

  const res = await fetch(
    `https://searchconsole.googleapis.com/webmasters/v3/sites/${encodeURIComponent(
      site,
    )}/searchAnalytics/query`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        startDate: daysAgo(31),
        endDate: daysAgo(3),
        dimensions: [],
        rowLimit: 1,
      }),
      cache: "no-store",
    },
  );

  const data: SearchAnalyticsResponse = await res.json();
  if (!res.ok) throw new Error(translateGoogleError(res.status, data?.error?.message));

  const row = data.rows?.[0];
  return {
    position: row?.position ? Math.round(row.position * 10) / 10 : 0,
    ctr: row?.ctr ? Math.round(row.ctr * 1000) / 10 : 0, // 0-1 → %
    clicks: Math.round(row?.clicks ?? 0),
    impressions: Math.round(row?.impressions ?? 0),
  };
}

interface SitesListResponse {
  siteEntry?: { siteUrl?: string; permissionLevel?: string }[];
  error?: { message?: string };
}

/** アクセス可能な Search Console サイト一覧 */
export async function listSearchConsoleSites(
  accessToken: string,
): Promise<SearchConsoleSite[]> {
  const res = await fetch("https://searchconsole.googleapis.com/webmasters/v3/sites", {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });
  const data: SitesListResponse = await res.json();
  if (!res.ok) throw new Error(translateGoogleError(res.status, data?.error?.message));

  return (data.siteEntry ?? [])
    .filter((s) => s.permissionLevel !== "siteUnverifiedUser")
    .map((s) => ({
      siteUrl: s.siteUrl ?? "",
      permissionLevel: s.permissionLevel ?? "",
    }))
    .filter((s) => s.siteUrl);
}

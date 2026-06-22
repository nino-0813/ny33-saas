import "server-only";

export interface Ga4Summary {
  pv: number; // ページビュー
  uu: number; // ユーザー数
  cv: number; // コンバージョン（キーイベント）
}

export interface Ga4Property {
  propertyId: string; // 数値
  label: string; // 表示名（アカウント / プロパティ）
}

/** 当月1日（YYYY-MM-DD） */
function firstOfMonth(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
}

interface RunReportResponse {
  rows?: { metricValues?: { value?: string }[] }[];
  error?: { message?: string; status?: string };
}

/** GA4 Data API で当月（1日〜今日）の PV / UU / CV を取得 */
export async function fetchGa4Summary(
  accessToken: string,
  propertyId: string,
): Promise<Ga4Summary> {
  const id = propertyId.replace(/[^0-9]/g, "");
  if (!id) throw new Error("GA4 のプロパティID（数値）が正しくありません");

  const res = await fetch(
    `https://analyticsdata.googleapis.com/v1beta/properties/${id}:runReport`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        dateRanges: [{ startDate: firstOfMonth(), endDate: "today" }],
        metrics: [
          { name: "screenPageViews" },
          { name: "totalUsers" },
          { name: "keyEvents" },
        ],
      }),
      cache: "no-store",
    },
  );

  const data: RunReportResponse = await res.json();
  if (!res.ok) throw new Error(translateGoogleError(res.status, data?.error?.message));

  const v = data.rows?.[0]?.metricValues ?? [];
  const num = (i: number) => Math.round(Number(v[i]?.value ?? 0));
  return { pv: num(0), uu: num(1), cv: num(2) };
}

export interface Ga4Channel {
  channel: string; // 流入元（チャネルグループ）
  sessions: number;
  users: number;
  conversions: number; // キーイベント（CV）
  cvr: number; // セッションCV率（%）
}

interface ChannelReportResponse {
  rows?: {
    dimensionValues?: { value?: string }[];
    metricValues?: { value?: string }[];
  }[];
  error?: { message?: string };
}

/** GA4 で直近28日の「流入元（チャネルグループ）別」のセッション・ユーザー・CV・CV率を取得 */
export async function fetchGa4Channels(
  accessToken: string,
  propertyId: string,
): Promise<Ga4Channel[]> {
  const id = propertyId.replace(/[^0-9]/g, "");
  if (!id) throw new Error("GA4 のプロパティID（数値）が正しくありません");

  const res = await fetch(
    `https://analyticsdata.googleapis.com/v1beta/properties/${id}:runReport`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        dateRanges: [{ startDate: "28daysAgo", endDate: "yesterday" }],
        dimensions: [{ name: "sessionDefaultChannelGroup" }],
        metrics: [
          { name: "sessions" },
          { name: "totalUsers" },
          { name: "keyEvents" },
        ],
        orderBys: [{ metric: { metricName: "sessions" }, desc: true }],
        limit: 12,
      }),
      cache: "no-store",
    },
  );

  const data: ChannelReportResponse = await res.json();
  if (!res.ok) throw new Error(translateGoogleError(res.status, data?.error?.message));

  return (data.rows ?? []).map((row) => {
    const channel = row.dimensionValues?.[0]?.value || "(その他)";
    const m = row.metricValues ?? [];
    const sessions = Math.round(Number(m[0]?.value ?? 0));
    const users = Math.round(Number(m[1]?.value ?? 0));
    const conversions = Math.round(Number(m[2]?.value ?? 0));
    const cvr = sessions > 0 ? (conversions / sessions) * 100 : 0;
    return { channel, sessions, users, conversions, cvr };
  });
}

export interface Ga4Event {
  name: string;
  count: number;
}

/** GA4 で直近28日に発生したイベント名と回数を取得（CV候補の発見に使う） */
export async function fetchGa4Events(
  accessToken: string,
  propertyId: string,
): Promise<Ga4Event[]> {
  const id = propertyId.replace(/[^0-9]/g, "");
  if (!id) throw new Error("GA4 のプロパティID（数値）が正しくありません");

  const res = await fetch(
    `https://analyticsdata.googleapis.com/v1beta/properties/${id}:runReport`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        dateRanges: [{ startDate: "28daysAgo", endDate: "yesterday" }],
        dimensions: [{ name: "eventName" }],
        metrics: [{ name: "eventCount" }],
        orderBys: [{ metric: { metricName: "eventCount" }, desc: true }],
        limit: 30,
      }),
      cache: "no-store",
    },
  );

  const data: ChannelReportResponse = await res.json();
  if (!res.ok) throw new Error(translateGoogleError(res.status, data?.error?.message));

  return (data.rows ?? []).map((row) => ({
    name: row.dimensionValues?.[0]?.value || "(不明)",
    count: Math.round(Number(row.metricValues?.[0]?.value ?? 0)),
  }));
}

interface AccountSummariesResponse {
  accountSummaries?: {
    displayName?: string;
    propertySummaries?: { property?: string; displayName?: string }[];
  }[];
  error?: { message?: string };
}

/** アクセス可能な GA4 プロパティ一覧（Admin API） */
export async function listGa4Properties(
  accessToken: string,
): Promise<Ga4Property[]> {
  const res = await fetch(
    "https://analyticsadmin.googleapis.com/v1beta/accountSummaries?pageSize=200",
    { headers: { Authorization: `Bearer ${accessToken}` }, cache: "no-store" },
  );
  const data: AccountSummariesResponse = await res.json();
  if (!res.ok) throw new Error(translateGoogleError(res.status, data?.error?.message));

  const out: Ga4Property[] = [];
  for (const acc of data.accountSummaries ?? []) {
    for (const p of acc.propertySummaries ?? []) {
      const id = (p.property ?? "").replace("properties/", "");
      if (!id) continue;
      out.push({
        propertyId: id,
        label: `${p.displayName ?? id}（${acc.displayName ?? ""}）`,
      });
    }
  }
  return out;
}

export function translateGoogleError(status: number, message?: string): string {
  if (status === 401) return "認証が切れています。Google 連携をやり直してください。";
  if (status === 403)
    return "権限がありません。連携した Google アカウントに該当プロパティの権限があるか確認してください。";
  if (status === 404) return "対象が見つかりません。選択内容をご確認ください。";
  if (status === 400) return "リクエストが不正です。選択内容をご確認ください。";
  return message ? `取得に失敗しました: ${message}` : "取得に失敗しました";
}

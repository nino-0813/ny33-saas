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

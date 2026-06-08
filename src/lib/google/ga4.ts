import "server-only";
import { getAccessToken, GA_SCOPE } from "./auth";

export interface Ga4Summary {
  pv: number; // ページビュー
  uu: number; // ユーザー数
  cv: number; // コンバージョン（キーイベント）
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

/**
 * GA4 Data API で当月（1日〜今日）の PV / UU / CV を取得。
 * propertyId は数値プロパティID（例 "123456789"）。
 */
export async function fetchGa4Summary(propertyId: string): Promise<Ga4Summary> {
  const id = propertyId.replace(/[^0-9]/g, "");
  if (!id) {
    throw new Error("GA4 のプロパティID（数値）が正しくありません");
  }

  const token = await getAccessToken([GA_SCOPE]);

  const res = await fetch(
    `https://analyticsdata.googleapis.com/v1beta/properties/${id}:runReport`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
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

  if (!res.ok) {
    throw new Error(translateGoogleError(res.status, data?.error?.message));
  }

  const v = data.rows?.[0]?.metricValues ?? [];
  const num = (i: number) => Math.round(Number(v[i]?.value ?? 0));
  return { pv: num(0), uu: num(1), cv: num(2) };
}

export function translateGoogleError(status: number, message?: string): string {
  if (status === 403) {
    return "サービスアカウントに閲覧権限がありません。GA4/Search Console にサービスアカウントのメールを追加してください。";
  }
  if (status === 404) {
    return "プロパティが見つかりません。プロパティID/サイトURLをご確認ください。";
  }
  if (status === 400) {
    return "リクエストが不正です。プロパティID/サイトURLの形式をご確認ください。";
  }
  return message ? `取得に失敗しました: ${message}` : "取得に失敗しました";
}

import "server-only";
import { statusFromScore, type MeasureResult } from "./shared";

interface PsiResponse {
  lighthouseResult?: {
    categories?: { performance?: { score?: number | null } };
    audits?: Record<string, { displayValue?: string }>;
  };
  error?: { message?: string };
}

/** PageSpeed Insights で表示速度を実測（strategy: desktop=表示速度, mobile=モバイル） */
export async function runPageSpeed(
  url: string,
  strategy: "mobile" | "desktop",
): Promise<MeasureResult> {
  const key = process.env.PAGESPEED_API_KEY;
  const api =
    `https://www.googleapis.com/pagespeedonline/v5/runPagespeed` +
    `?url=${encodeURIComponent(url)}&strategy=${strategy}&category=performance` +
    (key ? `&key=${key}` : "");

  const res = await fetch(api, { cache: "no-store" });
  const data: PsiResponse = await res.json();
  if (!res.ok) {
    throw new Error(data?.error?.message || "PageSpeed の取得に失敗しました");
  }

  const lh = data.lighthouseResult;
  const perf = lh?.categories?.performance?.score;
  const score = perf != null ? Math.round(perf * 100) : 0;
  const audits = lh?.audits ?? {};
  const dv = (k: string) => audits[k]?.displayValue ?? "—";

  return {
    score,
    status: statusFromScore(score),
    metrics: [
      { label: "パフォーマンス", value: String(score), sub: "/ 100" },
      { label: "LCP", value: dv("largest-contentful-paint") },
      { label: "CLS", value: dv("cumulative-layout-shift") },
      { label: "TBT", value: dv("total-blocking-time") },
    ],
    note: `PageSpeed Insights（${strategy === "mobile" ? "モバイル" : "PC"}）`,
  };
}

"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  aiIssues as sampleIssues,
  health as sampleHealth,
} from "@/lib/mock";

export interface OnboardingResult {
  error?: string;
}

/* 連携ソースの定義（オンボーディングで入力／スキップ可能） */
const SOURCE_DEFS = [
  {
    key: "ga4",
    field: "ga4_id",
    name: "Google Analytics 4",
    metrics: [
      { label: "PV", value: "18,420" },
      { label: "UU", value: "9,310" },
      { label: "CV", value: "34" },
    ],
  },
  {
    key: "gsc",
    field: "site_url", // 会社URLを使用
    name: "Search Console",
    metrics: [
      { label: "検索順位", value: "12.4" },
      { label: "CTR", value: "3.8%" },
    ],
  },
  {
    key: "gbp",
    field: "gbp",
    name: "Google ビジネス",
    metrics: [
      { label: "口コミ", value: "48" },
      { label: "閲覧数", value: "5,120" },
    ],
  },
  {
    key: "instagram",
    field: "instagram",
    name: "Instagram",
    metrics: [
      { label: "フォロワー", value: "1,240" },
      { label: "投稿数", value: "86" },
    ],
  },
  {
    key: "line",
    field: "line",
    name: "LINE 公式アカウント",
    metrics: [
      { label: "登録者", value: "860" },
      { label: "ブロック率", value: "4.2%" },
    ],
  },
];

export async function completeOnboarding(
  _prev: OnboardingResult,
  formData: FormData,
): Promise<OnboardingResult> {
  const str = (k: string) => String(formData.get(k) ?? "").trim();
  const name = str("name");
  if (!name) return { error: "会社名を入力してください。" };

  const industry = str("industry");
  const area = str("area");
  const employees = parseInt(str("employees") || "0", 10) || 0;
  const websiteUrl = str("website_url");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // 会社を作成（再実行に備えて owner_id で upsert）
  const { data: company, error } = await supabase
    .from("companies")
    .upsert(
      {
        owner_id: user.id,
        name,
        industry,
        area,
        employees,
        website_url: websiteUrl,
        plan: "ライト",
        competitor_area: area && industry ? `${area}の${industry}` : "同業他社",
        competitor_total: 120,
        is_sample: true,
        onboarded_at: new Date().toISOString(),
      },
      { onConflict: "owner_id" },
    )
    .select("id")
    .single();

  if (error || !company) {
    return { error: "保存に失敗しました。時間をおいて再度お試しください。" };
  }
  const companyId = company.id;

  // データ連携ソース（入力があれば連携中、無ければ未連携）
  const sources = SOURCE_DEFS.map((d, i) => {
    const value = d.field === "site_url" ? websiteUrl : str(d.field);
    const connected = value.length > 0;
    // ソースごとに config のキー名を合わせる（同期処理が参照する）
    let config: Record<string, string> = {};
    if (value) {
      if (d.key === "ga4") config = { propertyId: value.replace(/[^0-9]/g, "") };
      else if (d.key === "gsc") config = { siteUrl: value };
      else config = { value };
    }
    return {
      company_id: companyId,
      source_key: d.key,
      name: d.name,
      status: connected ? "connected" : "disconnected",
      metrics: connected ? d.metrics : [],
      config,
      last_sync: connected ? new Date().toISOString() : null,
      sort: i,
    };
  });

  await Promise.all([
    supabase.from("data_sources").insert(sources),
    seedSampleData(supabase, companyId),
  ]);

  revalidatePath("/", "layout");
  redirect("/");
}

/* ============================================================
 * サンプルデータ（連携が完了するまでダッシュボードを体験できるよう投入）
 * ========================================================== */

type SupabaseServer = Awaited<ReturnType<typeof createClient>>;

const MONTHS = [
  "2025-09", "2025-10", "2025-11", "2025-12", "2026-01",
  "2026-02", "2026-03", "2026-04", "2026-05", "2026-06",
];
const S = {
  sales: [232, 244, 251, 259, 266, 274, 281, 287, 285, 300],
  profit: [50, 53, 55, 57, 59, 62, 65, 67, 68, 72],
  inquiries: [22, 24, 25, 26, 27, 29, 30, 31, 30, 34],
  cvr: [26, 25.5, 25, 24.8, 24.5, 24.7, 24.6, 24.4, 24.7, 23.5],
  seo: [18, 17.2, 16.5, 15.8, 15, 14.2, 13.5, 13, 12.8, 12.4],
  reviews: [38, 39, 40, 41, 42, 43, 44, 45, 45, 48],
  ig: [980, 1015, 1050, 1085, 1120, 1150, 1180, 1205, 1178, 1240],
  line: [700, 728, 752, 775, 795, 815, 835, 848, 853, 860],
  block: [5.6, 5.3, 5.1, 4.9, 4.7, 4.6, 4.5, 4.4, 4.3, 4.2],
  health: [52, 57, 60, 63, 66, 69, 71, 74, 75, 78],
  improvement: [600000, 700000, 800000, 850000, 900000, 950000, 1000000, 1050000, 1100000, 1200000],
};

const COMPETITOR_SEED = [
  { label: "SEO 平均順位", ours_value: 12.4, ours_label: "12.4位", industry_avg: 18.5, top_value: 3.2, unit: "位", rank_in_area: 17, total_in_area: 120, higher_is_better: false, status: "warn" },
  { label: "Google 口コミ数", ours_value: 48, ours_label: "48件", industry_avg: 65, top_value: 210, unit: "件", rank_in_area: 32, total_in_area: 120, higher_is_better: true, status: "bad" },
  { label: "サイト月間PV", ours_value: 18420, ours_label: "18,420", industry_avg: 9800, top_value: 42000, unit: "", rank_in_area: 9, total_in_area: 120, higher_is_better: true, status: "good" },
  { label: "Instagram フォロワー", ours_value: 1240, ours_label: "1,240人", industry_avg: 980, top_value: 5600, unit: "人", rank_in_area: 14, total_in_area: 120, higher_is_better: true, status: "good" },
  { label: "LINE 登録者", ours_value: 860, ours_label: "860人", industry_avg: 420, top_value: 2100, unit: "人", rank_in_area: 6, total_in_area: 120, higher_is_better: true, status: "good" },
  { label: "成約率", ours_value: 23.5, ours_label: "23.5%", industry_avg: 19.0, top_value: 31.0, unit: "%", rank_in_area: 0, total_in_area: 0, higher_is_better: true, status: "good" },
];

async function seedSampleData(supabase: SupabaseServer, companyId: string) {
  const reports = MONTHS.map((m, i) => ({
    company_id: companyId,
    month: `${m}-01`,
    sales: S.sales[i],
    profit: S.profit[i],
    inquiries: S.inquiries[i],
    cvr: S.cvr[i],
    seo_rank: S.seo[i],
    reviews: S.reviews[i],
    ig_followers: S.ig[i],
    line_subscribers: S.line[i],
    line_block_rate: S.block[i],
    health_score: S.health[i],
    improvement_yen: S.improvement[i],
    health_breakdown: i === MONTHS.length - 1 ? sampleHealth.breakdown : [],
  }));

  const issues = sampleIssues.map((i) => ({
    company_id: companyId,
    month: "2026-06-01",
    rank: i.rank,
    title: i.title,
    detail: i.detail,
    loss_yen: i.lossYen,
    priority: i.priority,
    action: i.action,
  }));

  const competitor = COMPETITOR_SEED.map((m, i) => ({
    company_id: companyId,
    ...m,
    sort: i,
  }));

  await Promise.all([
    supabase.from("monthly_reports").insert(reports),
    supabase.from("ai_issues").insert(issues),
    supabase.from("competitor_metrics").insert(competitor),
  ]);
}

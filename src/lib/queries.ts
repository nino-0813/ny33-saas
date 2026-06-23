import "server-only";
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import {
  rankFromScore,
  type Kpi,
  type Trend,
  type HealthScore,
  type AiIssue,
  type DataSource,
  type KarteEntry,
  type CompetitorRow,
  type CompareMetric,
} from "@/lib/mock";
import type { Database } from "@/lib/database.types";

type ReportRow = Database["public"]["Tables"]["monthly_reports"]["Row"];

export interface DashboardData {
  company: {
    name: string;
    industry: string;
    area: string;
    description: string;
    employees: number;
    plan: string;
    competitorArea: string;
    competitorTotal: number;
    isSample: boolean;
  };
  kpis: Kpi[];
  health: HealthScore;
  improvementYen: number;
  aiIssues: AiIssue[];
  dataSources: DataSource[];
  karte: KarteEntry[];
  competitor: { area: string; total: number; rows: CompetitorRow[] };
  compareMetrics: CompareMetric[];
}

/** ログインユーザーのオンボーディング状況 */
export const getOnboardingStatus = cache(async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { authed: false, onboarded: false };

  const { data: c } = await supabase
    .from("companies")
    .select("onboarded_at")
    .eq("owner_id", user.id)
    .maybeSingle();

  return { authed: true, onboarded: Boolean(c?.onboarded_at) };
});

/* ============================================================
 * ダッシュボードデータ取得（オンボーディング済みの会社のみ）
 * ========================================================== */

export const getDashboardData = cache(
  async (): Promise<DashboardData | null> => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: company } = await supabase
    .from("companies")
    .select("*")
    .eq("owner_id", user.id)
    .maybeSingle();
  if (!company || !company.onboarded_at) return null;
  const companyId = company.id;

  const [reportsRes, sourcesRes, issuesRes, compRes] =
    await Promise.all([
      supabase
        .from("monthly_reports")
        .select("*")
        .eq("company_id", companyId)
        .order("month", { ascending: true }),
      supabase
        .from("data_sources")
        .select("*")
        .eq("company_id", companyId)
        .order("sort", { ascending: true }),
      supabase
        .from("ai_issues")
        .select("*")
        .eq("company_id", companyId)
        .order("rank", { ascending: true }),
      supabase
        .from("competitor_metrics")
        .select("*")
        .eq("company_id", companyId)
        .order("sort", { ascending: true }),
    ]);

  const c = company;
  const reports = reportsRes.data ?? [];
  if (reports.length === 0) return null;

  const latest = reports[reports.length - 1];

  return {
    company: {
      name: c.name,
      industry: c.industry,
      area: c.area,
      description: c.description ?? "",
      employees: c.employees,
      plan: c.plan,
      competitorArea: c.competitor_area,
      competitorTotal: c.competitor_total,
      isSample: c.is_sample,
    },
    kpis: buildKpis(reports),
    health: buildHealth(latest),
    improvementYen: latest.improvement_yen,
    aiIssues: (issuesRes.data ?? []).map((i) => ({
      rank: i.rank,
      title: i.title,
      detail: i.detail,
      lossYen: i.loss_yen,
      priority: i.priority,
      action: i.action,
    })),
    dataSources: (sourcesRes.data ?? []).map((s) => ({
      id: s.source_key,
      name: s.name,
      status: s.status as DataSource["status"],
      metrics: (s.metrics as { label: string; value: string }[]) ?? [],
      lastSync: s.last_sync ? formatSync(s.last_sync) : undefined,
    })),
    karte: reports.map((r) => ({
      month: r.month.slice(0, 7),
      sales: Number(r.sales),
      profit: Number(r.profit),
      health: r.health_score,
    })),
    competitor: {
      area: c.competitor_area,
      total: c.competitor_total,
      rows: (compRes.data ?? [])
        .filter((m) => m.total_in_area > 0)
        .map((m) => ({
          label: m.label,
          ours: m.ours_label,
          rankInArea: m.rank_in_area,
          totalInArea: m.total_in_area,
          status: m.status as CompetitorRow["status"],
        })),
    },
    compareMetrics: (compRes.data ?? []).map((m) => ({
      label: m.label,
      ours: Number(m.ours_value),
      industryAvg: Number(m.industry_avg),
      top: Number(m.top_value),
      unit: m.unit,
      higherIsBetter: m.higher_is_better,
    })),
  };
  },
);

/* ============================================================
 * 変換ヘルパー
 * ========================================================== */

function buildHealth(latest: ReportRow): HealthScore {
  const breakdown =
    (latest.health_breakdown as { label: string; score: number }[]) ?? [];
  return {
    score: latest.health_score,
    prevScore: latest.health_score, // prev は KPI 側で扱うため簡易
    rank: rankFromScore(latest.health_score),
    improvementYen: latest.improvement_yen,
    breakdown,
  };
}

function trendOf(diff: number, invert = false): Trend {
  const d = invert ? -diff : diff;
  if (d > 0) return "up";
  if (d < 0) return "down";
  return "flat";
}

function pct(latest: number, prev: number): string {
  if (!prev) return "—";
  const p = ((latest - prev) / prev) * 100;
  return `${p >= 0 ? "+" : ""}${p.toFixed(1)}% 前月比`;
}

function diffLabel(latest: number, prev: number, unit: string): string {
  const d = latest - prev;
  return `${d >= 0 ? "+" : ""}${Number.isInteger(d) ? d : d.toFixed(1)}${unit} 前月比`;
}

function buildKpis(reports: ReportRow[]): Kpi[] {
  const n = reports.length;
  const latest = reports[n - 1];
  const prev = reports[n - 2] ?? latest;
  const series = (key: keyof ReportRow) => reports.map((r) => Number(r[key]));

  return [
    {
      id: "sales",
      label: "売上",
      value: String(latest.sales),
      unit: "万円",
      deltaLabel: pct(Number(latest.sales), Number(prev.sales)),
      trend: trendOf(Number(latest.sales) - Number(prev.sales)),
      spark: series("sales"),
    },
    {
      id: "profit",
      label: "利益",
      value: String(latest.profit),
      unit: "万円",
      deltaLabel: pct(Number(latest.profit), Number(prev.profit)),
      trend: trendOf(Number(latest.profit) - Number(prev.profit)),
      spark: series("profit"),
    },
    {
      id: "inquiries",
      label: "問い合わせ数",
      value: String(latest.inquiries),
      unit: "件",
      deltaLabel: diffLabel(latest.inquiries, prev.inquiries, " 件"),
      trend: trendOf(latest.inquiries - prev.inquiries),
      spark: series("inquiries"),
    },
    {
      id: "cvr",
      label: "成約率",
      value: String(latest.cvr),
      unit: "%",
      deltaLabel: diffLabel(Number(latest.cvr), Number(prev.cvr), "pt"),
      trend: trendOf(Number(latest.cvr) - Number(prev.cvr)),
      spark: series("cvr"),
    },
    {
      id: "seo",
      label: "SEO 平均順位",
      value: String(latest.seo_rank),
      unit: "位",
      deltaLabel: `${(Number(prev.seo_rank) - Number(latest.seo_rank)).toFixed(1)} 改善`,
      trend: trendOf(Number(latest.seo_rank) - Number(prev.seo_rank), true),
      spark: series("seo_rank"),
    },
    {
      id: "meo",
      label: "Google口コミ",
      value: String(latest.reviews),
      unit: "件",
      deltaLabel: diffLabel(latest.reviews, prev.reviews, " 件"),
      trend: trendOf(latest.reviews - prev.reviews),
      spark: series("reviews"),
    },
    {
      id: "sns",
      label: "Instagram フォロワー",
      value: latest.ig_followers.toLocaleString("ja-JP"),
      unit: "人",
      deltaLabel: diffLabel(latest.ig_followers, prev.ig_followers, " 人"),
      trend: trendOf(latest.ig_followers - prev.ig_followers),
      spark: series("ig_followers"),
    },
    {
      id: "line",
      label: "LINE 登録者",
      value: latest.line_subscribers.toLocaleString("ja-JP"),
      unit: "人",
      deltaLabel: `ブロック率 ${latest.line_block_rate}%`,
      trend: "flat",
      spark: series("line_subscribers"),
    },
  ];
}

function formatSync(ts: string): string {
  const d = new Date(ts);
  const p = (x: number) => String(x).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
}


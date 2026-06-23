import { redirect } from "next/navigation";
import Link from "next/link";
import {
  ShieldCheck,
  MessageSquareText,
  Activity,
  ChartNoAxesCombined,
  ArrowRight,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
} from "lucide-react";
import ScoreTrendChart from "@/components/dashboard/ScoreTrendChart";
import DailyFocus from "@/components/dashboard/DailyFocus";
import GoalCard from "@/components/dashboard/GoalCard";
import FunnelBoard from "@/components/funnel/FunnelBoard";
import { getDashboardData } from "@/lib/queries";
import { getCurrentGoal } from "@/lib/goals-data";
import { getLiveMetrics } from "@/lib/live-metrics";
import type { Kpi, AiIssue } from "@/lib/mock";

export default async function HomePage() {
  const [data, goal, live] = await Promise.all([
    getDashboardData(),
    getCurrentGoal(),
    getLiveMetrics(),
  ]);
  if (!data) redirect("/onboarding");

  const today = new Intl.DateTimeFormat("ja-JP", {
    month: "long",
    day: "numeric",
    weekday: "short",
  }).format(new Date());

  const kpis = data.kpis.slice(0, 2);
  const issues = data.aiIssues.slice(0, 4);

  return (
    <div className="space-y-5 pt-2">
      {/* あいさつ */}
      <div>
        <p className="text-xs font-medium text-muted">{today}</p>
        <h1 className="mt-0.5 text-xl font-bold text-foreground">
          こんにちは、{data.company.name} さん
        </h1>
        <p className="mt-0.5 text-sm text-muted">
          今日のWeb集客の状況と、やるべきことをまとめました。
        </p>
      </div>

      {/* 集客ファネル（主役） */}
      <FunnelBoard />

      {/* AIの今日の一手 */}
      <DailyFocus />

      {/* 主要数値 */}
      {live.connected ? (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <ScoreMetric score={data.health.score} prev={data.health.prevScore} />
          {live.ga4 && (
            <SimpleMetric
              label="アクセス（ユーザー）"
              value={live.ga4.uu.toLocaleString()}
              sub={`PV ${live.ga4.pv.toLocaleString()}・CV ${live.ga4.cv.toLocaleString()}`}
            />
          )}
          {live.gsc && (
            <SimpleMetric
              label="検索 平均順位"
              value={`${live.gsc.position.toFixed(1)}位`}
              sub={`CTR ${live.gsc.ctr}%`}
            />
          )}
          <Link
            href="/traffic"
            className="flex flex-col justify-between rounded-2xl border border-dashed border-border bg-surface p-4 text-left transition-colors hover:border-primary/40 hover:bg-primary-weak/30"
          >
            <p className="text-xs font-medium text-muted">流入をくわしく</p>
            <span className="mt-1 inline-flex items-center gap-1 text-sm font-bold text-primary">
              流入分析を見る <ArrowRight className="h-4 w-4" />
            </span>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <ScoreMetric score={data.health.score} prev={data.health.prevScore} />
          {kpis.map((k) => (
            <KpiMetric key={k.id} kpi={k} />
          ))}
          <Link
            href="/sources"
            className="flex flex-col justify-between rounded-2xl border border-dashed border-border bg-surface p-4 text-left transition-colors hover:border-primary/40 hover:bg-primary-weak/30"
          >
            <p className="text-xs font-medium text-muted">実データを表示</p>
            <span className="mt-1 inline-flex items-center gap-1 text-sm font-bold text-primary">
              GA4と連携する <ArrowRight className="h-4 w-4" />
            </span>
          </Link>
        </div>
      )}

      {/* メイン2カラム */}
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
        {/* 目標 + やることリスト */}
        <div className="space-y-5 xl:col-span-2">
          <GoalCard goal={goal} />
          <TodoCard issues={issues} />
        </div>

        {/* 右: 推移 + クイック導線 */}
        <div className="space-y-5">
          <ScoreTrendChart />
          <QuickLinks />
        </div>
      </div>
    </div>
  );
}

/* ============================ 数値カード ============================ */

function ScoreMetric({ score, prev }: { score: number; prev: number }) {
  const delta = score - prev;
  return (
    <div className="rounded-2xl border border-border bg-surface p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-muted">Web健康スコア</p>
        <ShieldCheck className="h-4 w-4 text-good" />
      </div>
      <p className="mt-1 leading-none">
        <span className="text-3xl font-bold text-good">{score}</span>
        <span className="ml-1 text-xs font-medium text-muted">/ 100</span>
      </p>
      <DeltaText delta={delta} suffix="pt" prefix="前回比" />
    </div>
  );
}

function SimpleMetric({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-4 shadow-sm">
      <p className="text-xs font-medium text-muted">{label}</p>
      <p className="mt-1 truncate text-3xl font-bold leading-none text-foreground">{value}</p>
      {sub && <p className="mt-2 truncate text-xs text-muted">{sub}</p>}
    </div>
  );
}

function KpiMetric({ kpi }: { kpi: Kpi }) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-4 shadow-sm">
      <p className="text-xs font-medium text-muted">{kpi.label}</p>
      <p className="mt-1 truncate text-3xl font-bold leading-none text-foreground">
        {kpi.value}
        {kpi.unit && <span className="ml-0.5 text-xs font-medium text-muted">{kpi.unit}</span>}
      </p>
      <p
        className={`mt-2 flex items-center gap-1 text-xs font-bold ${
          kpi.trend === "up"
            ? "text-good"
            : kpi.trend === "down"
              ? "text-bad"
              : "text-muted"
        }`}
      >
        {kpi.trend === "up" ? (
          <ArrowUpRight className="h-3.5 w-3.5" />
        ) : kpi.trend === "down" ? (
          <ArrowDownRight className="h-3.5 w-3.5" />
        ) : (
          <Minus className="h-3.5 w-3.5" />
        )}
        {kpi.deltaLabel}
      </p>
    </div>
  );
}

function DeltaText({
  delta,
  suffix = "",
  prefix = "",
}: {
  delta: number;
  suffix?: string;
  prefix?: string;
}) {
  const up = delta > 0;
  const flat = delta === 0;
  return (
    <p
      className={`mt-2 flex items-center gap-1 text-xs font-bold ${
        flat ? "text-muted" : up ? "text-good" : "text-bad"
      }`}
    >
      {flat ? (
        <Minus className="h-3.5 w-3.5" />
      ) : up ? (
        <ArrowUpRight className="h-3.5 w-3.5" />
      ) : (
        <ArrowDownRight className="h-3.5 w-3.5" />
      )}
      {prefix} {up ? "+" : ""}
      {delta}
      {suffix}
    </p>
  );
}

/* ============================ やることリスト ============================ */

function TodoCard({ issues }: { issues: AiIssue[] }) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-foreground">今日のやること</h2>
          <p className="mt-0.5 text-xs text-muted">AIが検知した、効果の大きい順の改善ポイント</p>
        </div>
      </div>

      {issues.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted">
          いまのところ大きな課題はありません。集客チャットで次の一手を相談しましょう。
        </p>
      ) : (
        <ul className="space-y-2.5">
          {issues.map((t) => (
            <li
              key={t.rank}
              className="flex items-start gap-3 rounded-xl border border-border/70 bg-surface-2/40 p-3"
            >
              <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-white">
                {t.rank}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-foreground">{t.title}</p>
                <p className="mt-0.5 text-xs leading-relaxed text-muted">{t.detail}</p>
                <Link
                  href="/chat"
                  className="mt-1.5 inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline"
                >
                  進め方を相談する <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
              {t.lossYen > 0 && (
                <span className="shrink-0 rounded-md bg-bad-weak px-2 py-1 text-[11px] font-bold text-bad">
                  -{t.lossYen.toLocaleString()}円/月
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/* ============================ クイック導線 ============================ */

const LINKS = [
  {
    href: "/chat",
    label: "集客チャット",
    desc: "AIに集客の相談をする",
    icon: MessageSquareText,
  },
  {
    href: "/traffic",
    label: "流入分析",
    desc: "成果につながる流入元を見る",
    icon: Activity,
  },
  {
    href: "/forecast",
    label: "需要予測",
    desc: "先の検索需要を読む",
    icon: ChartNoAxesCombined,
  },
];

function QuickLinks() {
  return (
    <div className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
      <h2 className="mb-3 text-base font-bold text-foreground">よく使う機能</h2>
      <div className="space-y-2">
        {LINKS.map((l) => {
          const Icon = l.icon;
          return (
            <Link
              key={l.href}
              href={l.href}
              className="group flex items-center gap-3 rounded-xl border border-border/70 p-3 transition-colors hover:border-primary/40 hover:bg-primary-weak/30"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary-weak text-primary">
                <Icon className="h-5 w-5" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-foreground">{l.label}</p>
                <p className="truncate text-xs text-muted">{l.desc}</p>
              </div>
              <ArrowRight className="h-4 w-4 text-muted transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
            </Link>
          );
        })}
      </div>
    </div>
  );
}

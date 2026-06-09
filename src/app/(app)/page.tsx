import { redirect } from "next/navigation";
import Link from "next/link";
import { ShieldCheck, ChevronRight } from "lucide-react";
import ScoreTrendChart from "@/components/dashboard/ScoreTrendChart";
import CheckList from "@/components/checks/CheckList";
import { Delta } from "@/components/checks/bits";
import { getDashboardData } from "@/lib/queries";
import { getMeasuredMap } from "@/lib/checks-data";
import {
  summary,
  priorityTasks,
  newsItems,
  webChecks,
  type Priority,
  type NewsTag,
} from "@/lib/webdock";

export default async function DashboardPage() {
  const data = await getDashboardData();
  if (!data) redirect("/onboarding");
  const measured = await getMeasuredMap();

  return (
    <div className="space-y-5">
      {/* 上部サマリー */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <ScoreCard />
        <DualCard
          items={[
            { label: "累計検出数", value: summary.totalDetections, unit: "件", delta: summary.totalDetectionsDelta, deltaUnit: "件", deltaPrefix: "前月比" },
            { label: "今月のチェック数", value: summary.monthlyChecks, unit: "件", delta: summary.monthlyChecksDelta, deltaUnit: "件", deltaPrefix: "前月比" },
          ]}
        />
        <DualCard
          items={[
            { label: "要対応の項目", value: summary.needsAction, unit: "件", delta: summary.needsActionDelta, deltaUnit: "件", deltaPrefix: "前回比" },
            { label: "すべて正常の項目", value: summary.allNormal, unit: "件", delta: summary.allNormalDelta, deltaUnit: "件", deltaPrefix: "前回比" },
          ]}
        />
      </div>

      {/* メイン: チェック一覧 + 右カラム */}
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <CheckList
            title="チェック項目の一覧"
            overrides={measured}
            headerAction={
              <Link
                href="/checks"
                className="inline-flex items-center gap-0.5 text-sm font-medium text-good hover:underline"
              >
                すべてのチェック結果を見る
                <ChevronRight className="h-4 w-4" />
              </Link>
            }
          />
        </div>
        <div className="space-y-5">
          <ScoreTrendChart />
          <PriorityTasksCard />
          <NewsCard />
        </div>
      </div>
    </div>
  );
}

/* ============================ 上部カード ============================ */

function ScoreCard() {
  return (
    <div className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
      <p className="mb-2 text-sm font-bold text-foreground">Web健康スコア</p>
      <div className="flex items-center justify-between">
        <div>
          <p className="leading-none">
            <span className="text-5xl font-bold text-good">{summary.healthScore}</span>
            <span className="ml-1 text-base font-medium text-muted">/ 100</span>
          </p>
          <span className="mt-3 inline-block rounded-md bg-good-weak px-2.5 py-1 text-xs font-bold text-good">
            {summary.scoreLabel}
          </span>
          <p className="mt-2 text-[11px] text-muted">全{webChecks.length}項目の判定から算出</p>
        </div>
        <div className="flex flex-col items-center gap-1.5">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-good-weak">
            <ShieldCheck className="h-8 w-8 text-good" strokeWidth={2.2} />
          </div>
          <Delta value={summary.scoreDelta} prefix="前回比" />
        </div>
      </div>
    </div>
  );
}

interface MetricItem {
  label: string;
  value: number;
  unit: string;
  delta: number;
  deltaUnit: string;
  deltaPrefix: string;
}

function DualCard({ items }: { items: MetricItem[] }) {
  return (
    <div className="grid grid-cols-2 gap-4 rounded-2xl border border-border bg-surface p-5 shadow-sm">
      {items.map((m) => (
        <div key={m.label}>
          <p className="text-sm font-medium text-muted">{m.label}</p>
          <p className="mt-1 leading-none">
            <span className="text-4xl font-bold text-foreground">{m.value}</span>
            <span className="ml-1 text-sm font-medium text-muted">{m.unit}</span>
          </p>
          <div className="mt-2">
            <Delta value={m.delta} prefix={m.deltaPrefix} unit={m.deltaUnit} />
          </div>
        </div>
      ))}
    </div>
  );
}

/* ============================ 優先タスク ============================ */

const PRIORITY_META: Record<Priority, { label: string; cls: string }> = {
  high: { label: "優先度：高", cls: "bg-red-50 text-red-600" },
  mid: { label: "優先度：中", cls: "bg-amber-50 text-amber-600" },
  low: { label: "優先度：低", cls: "bg-blue-50 text-blue-600" },
};

function PriorityTasksCard() {
  return (
    <div className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="text-base font-bold text-foreground">
          今週の優先タスク <span className="text-xs font-medium text-muted">（推奨アクション）</span>
        </h2>
        <Link href="/tasks" className="shrink-0 text-xs font-medium text-good hover:underline">
          すべてのタスクを見る
        </Link>
      </div>
      <ul className="space-y-2.5">
        {priorityTasks.map((t) => {
          const meta = PRIORITY_META[t.priority];
          return (
            <li key={t.rank} className="flex items-center gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-surface-2 text-xs font-bold text-muted">
                {t.rank}
              </span>
              <span className="flex-1 text-sm text-foreground">{t.text}</span>
              <span className={`shrink-0 rounded-md px-2 py-0.5 text-[11px] font-bold ${meta.cls}`}>
                {meta.label}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/* ============================ お知らせ ============================ */

const NEWS_META: Record<NewsTag, { label: string; cls: string }> = {
  new: { label: "新着", cls: "bg-red-50 text-red-600" },
  feature: { label: "機能追加", cls: "bg-blue-50 text-blue-600" },
  info: { label: "お知らせ", cls: "bg-slate-100 text-slate-500" },
};

function NewsCard() {
  return (
    <div className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="text-base font-bold text-foreground">最新のお知らせ</h2>
        <Link href="/news" className="shrink-0 text-xs font-medium text-good hover:underline">
          すべてのお知らせを見る
        </Link>
      </div>
      <ul className="space-y-3.5">
        {newsItems.map((n, i) => {
          const meta = NEWS_META[n.tag];
          return (
            <li key={i}>
              <div className="flex items-center gap-2">
                <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${meta.cls}`}>
                  {meta.label}
                </span>
                <span className="text-[11px] text-muted">{n.date}</span>
              </div>
              <p className="mt-1 text-sm text-foreground">{n.title}</p>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

import { redirect } from "next/navigation";
import { Download, FileText, ShieldCheck, ChevronRight } from "lucide-react";
import { Delta } from "@/components/checks/bits";
import { getDashboardData } from "@/lib/queries";
import {
  summary,
  reportHistory,
  webChecks,
  scoreRank,
} from "@/lib/webdock";

export const metadata = { title: "レポート — Webドック" };

export default async function ReportsPage() {
  const data = await getDashboardData();
  if (!data) redirect("/onboarding");

  return (
    <div className="space-y-5">
      {/* 今月のレポート */}
      <div className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-bold text-foreground">今月のレポート</h2>
            <p className="text-xs text-muted">2026年6月（2026/06/01 - 06/30）</p>
          </div>
          <button className="inline-flex items-center gap-2 rounded-full bg-navy px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-navy/90">
            <Download className="h-4 w-4" />
            PDFダウンロード
          </button>
        </div>

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[260px_1fr]">
          {/* スコア */}
          <div className="flex items-center gap-4 rounded-xl bg-surface-2 p-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-good-weak">
              <ShieldCheck className="h-8 w-8 text-good" strokeWidth={2.2} />
            </div>
            <div>
              <p className="text-xs text-muted">Web健康スコア</p>
              <p className="leading-none">
                <span className="text-4xl font-bold text-good">{summary.healthScore}</span>
                <span className="ml-1 text-sm text-muted">/ 100</span>
              </p>
              <div className="mt-1.5 flex items-center gap-2">
                <span className="rounded-md bg-good-weak px-2 py-0.5 text-[11px] font-bold text-good">
                  {scoreRank(summary.healthScore)}
                </span>
                <Delta value={summary.scoreDelta} prefix="前月比" />
              </div>
            </div>
          </div>

          {/* チェック別スコア */}
          <div>
            <p className="mb-2 text-xs font-medium text-muted">チェック別スコア</p>
            <div className="grid grid-cols-1 gap-x-6 gap-y-2 sm:grid-cols-2">
              {webChecks.map((c) => (
                <div key={c.id} className="flex items-center gap-2">
                  <span className="w-40 shrink-0 truncate text-xs text-foreground">{c.name}</span>
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-2">
                    <div className="h-full rounded-full bg-good" style={{ width: `${c.score}%` }} />
                  </div>
                  <span className="w-7 shrink-0 text-right text-xs font-bold text-foreground">
                    {c.score}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 過去のレポート */}
      <div className="overflow-hidden rounded-2xl border border-border bg-surface shadow-sm">
        <div className="px-5 py-4">
          <h2 className="text-base font-bold text-foreground">過去のレポート</h2>
          <p className="mt-0.5 text-xs text-muted">毎月のWeb健康診断レポート</p>
        </div>
        <ul className="divide-y divide-border">
          {reportHistory.map((r) => (
            <li
              key={r.month}
              className="flex items-center gap-4 px-5 py-3.5 transition-colors hover:bg-surface-2/60"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-surface-2 text-muted">
                <FileText className="h-5 w-5" />
              </div>
              <span className="w-28 shrink-0 text-sm font-medium text-foreground">{r.label}</span>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-foreground">{r.score}</span>
                <span className="text-[11px] text-muted">/ 100</span>
                <span className="rounded bg-surface-2 px-1.5 py-0.5 text-[10px] font-bold text-muted">
                  {scoreRank(r.score)}
                </span>
              </div>
              <div className="ml-auto flex items-center gap-4">
                <Delta value={r.delta} prefix="前月比" />
                <button className="inline-flex items-center gap-0.5 text-sm font-medium text-good hover:underline">
                  表示
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

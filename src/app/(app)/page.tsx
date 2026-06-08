import { redirect } from "next/navigation";
import Link from "next/link";
import { Info, ArrowRight, AlertCircle, Trophy, Plug } from "lucide-react";
import KpiStats from "@/components/dashboard/KpiStats";
import HealthRadar from "@/components/dashboard/HealthRadar";
import KarteAreaChart from "@/components/dashboard/KarteAreaChart";
import { UxbCard, CardHead, StatusPill } from "@/components/dashboard/uxb";
import { getDashboardData } from "@/lib/queries";
import { yen, rankFromScore } from "@/lib/mock";

export default async function DashboardPage() {
  const data = await getDashboardData();
  if (!data) redirect("/onboarding");

  const n = data.karte.length;
  const topIssue = data.aiIssues[0];

  // 競合のステータス内訳（セグメントバー用）
  const compRows = data.competitor.rows;
  const counts = {
    good: compRows.filter((r) => r.status === "good").length,
    warn: compRows.filter((r) => r.status === "warn").length,
    bad: compRows.filter((r) => r.status === "bad").length,
  };
  const total = compRows.length || 1;

  const statusPill: Record<string, "good" | "warn" | "bad" | "neutral"> = {
    connected: "good",
    syncing: "warn",
    disconnected: "neutral",
  };
  const statusLabel: Record<string, string> = {
    connected: "連携中",
    syncing: "同期中",
    disconnected: "未連携",
  };

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* サンプルデータ通知 */}
        {data.company.isSample && (
          <Link
            href="/sources"
            className="flex items-center gap-3 rounded-2xl bg-white px-4 py-3 shadow-sm ring-1 ring-black/[0.04] transition-colors hover:bg-gray-50"
          >
            <Info className="h-5 w-5 shrink-0 text-emerald-500" />
            <p className="flex-1 text-sm text-black">
              現在は<span className="font-semibold">サンプルデータ</span>を表示しています。データ連携を完了すると、実際の数値に自動で切り替わります。
            </p>
            <span className="hidden items-center gap-1 text-sm font-semibold text-emerald-600 sm:inline-flex">
              連携を設定
              <ArrowRight className="h-4 w-4" />
            </span>
          </Link>
        )}

        {/* KPI */}
        <KpiStats kpis={data.kpis} />

        {/* メイングリッド */}
        <div className="grid grid-cols-1 gap-3 sm:gap-4 lg:grid-cols-12">
          {/* 左: 健康度レーダー */}
          <div className="lg:col-span-4">
            <HealthRadar
              health={data.health}
              rankLabel={rankFromScore(data.health.score)}
            />
          </div>

          {/* 中央: カルテ + AI診断 */}
          <div className="space-y-3 sm:space-y-4 lg:col-span-5">
            <KarteAreaChart karte={data.karte} />

            <UxbCard>
              <CardHead title="Company AI の今月の診断" />
              <div className="space-y-2.5">
                {data.aiIssues.map((issue) => (
                  <div
                    key={issue.rank}
                    className="flex items-start gap-3 rounded-xl bg-gray-50 p-3"
                  >
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-black text-xs font-bold text-white">
                      {issue.rank}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-semibold text-black">{issue.title}</p>
                        <span className="shrink-0 text-xs font-semibold text-orange-500">
                          -{yen(issue.lossYen)}/月
                        </span>
                      </div>
                      <p className="mt-0.5 line-clamp-2 text-xs text-gray-500">
                        {issue.action}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </UxbCard>
          </div>

          {/* 右: 統計カード */}
          <div className="space-y-3 sm:space-y-4 lg:col-span-3">
            {/* 利益改善の余地 */}
            <UxbCard>
              <div className="mb-1 text-xs font-medium text-gray-500">利益改善の余地</div>
              <div className="font-uxb mb-2 text-2xl font-bold text-black sm:text-3xl">
                +{yen(data.improvementYen)}
                <span className="ml-1 text-sm font-medium text-gray-400">/月</span>
              </div>
              <StatusPill tone="good">GOOD</StatusPill>
            </UxbCard>

            {/* 最重要課題 */}
            {topIssue && (
              <UxbCard>
                <div className="mb-1 text-xs font-medium text-gray-500">今月の最重要課題</div>
                <div className="mb-2 text-lg font-bold text-black">{topIssue.title}</div>
                <StatusPill tone="bad">要対応</StatusPill>
                <div className="mt-3 flex items-start gap-1.5 rounded-lg bg-gray-50 p-2">
                  <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-orange-500" />
                  <p className="text-[11px] leading-relaxed text-gray-600">
                    推定損失 {yen(topIssue.lossYen)}/月。{topIssue.action}
                  </p>
                </div>
              </UxbCard>
            )}

            {/* 競合ポジション */}
            <UxbCard>
              <CardHead
                title="競合ポジション"
                action={<Trophy className="h-4 w-4 text-gray-400" />}
              />
              <p className="-mt-2 mb-3 text-[11px] text-gray-500">
                {data.competitor.area}・全{data.competitor.total}社中
              </p>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div>
                  <div className="text-[10px] text-gray-500">上位</div>
                  <div className="font-uxb text-xl font-bold text-black">{counts.good}</div>
                </div>
                <div>
                  <div className="text-[10px] text-gray-500">平均的</div>
                  <div className="font-uxb text-xl font-bold text-black">{counts.warn}</div>
                </div>
                <div>
                  <div className="text-[10px] text-gray-500">要改善</div>
                  <div className="font-uxb text-xl font-bold text-black">{counts.bad}</div>
                </div>
              </div>
              <div className="mt-3 flex h-2.5 overflow-hidden rounded-full">
                <div className="bg-emerald-500" style={{ width: `${(counts.good / total) * 100}%` }} />
                <div className="bg-yellow-400" style={{ width: `${(counts.warn / total) * 100}%` }} />
                <div className="bg-orange-500" style={{ width: `${(counts.bad / total) * 100}%` }} />
              </div>
              <div className="mt-3 space-y-1.5">
                {compRows.slice(0, 3).map((r) => (
                  <div key={r.label} className="flex items-center justify-between text-[11px]">
                    <span className="text-gray-600">{r.label}</span>
                    <span
                      className="font-semibold"
                      style={{
                        color:
                          r.status === "good"
                            ? "#10b981"
                            : r.status === "warn"
                              ? "#ca8a04"
                              : "#f97316",
                      }}
                    >
                      {r.rankInArea}位 / {r.totalInArea}社
                    </span>
                  </div>
                ))}
              </div>
            </UxbCard>
          </div>
        </div>

        {/* データ連携ストリップ */}
        <UxbCard>
          <CardHead
            title="データ連携"
            action={<Plug className="h-4 w-4 text-gray-400" />}
          />
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-5">
            {data.dataSources.map((src) => {
              const primary = src.metrics[0];
              return (
                <div key={src.id} className="rounded-xl bg-gray-50 p-3">
                  <div className="mb-1.5 flex items-center justify-between gap-2">
                    <span className="truncate text-[11px] font-semibold text-black">
                      {src.name}
                    </span>
                    <StatusPill tone={statusPill[src.status]}>
                      {statusLabel[src.status]}
                    </StatusPill>
                  </div>
                  {primary ? (
                    <div className="font-uxb text-lg font-bold text-black">
                      {primary.value}
                      <span className="ml-1 text-[10px] font-medium text-gray-400">
                        {primary.label}
                      </span>
                    </div>
                  ) : (
                    <div className="text-xs text-gray-400">未連携</div>
                  )}
                </div>
              );
            })}
          </div>
        </UxbCard>
    </div>
  );
}

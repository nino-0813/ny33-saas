import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, RefreshCw, CheckCircle2, Lightbulb, ArrowRight, Zap } from "lucide-react";
import ScoreTrendChart from "@/components/dashboard/ScoreTrendChart";
import CheckSettingsForm from "@/components/checks/CheckSettingsForm";
import { CHECK_ICONS } from "@/components/checks/icons";
import { Delta, StatusBadge } from "@/components/checks/bits";
import { createClient } from "@/lib/supabase/server";
import { getCheckRealData, type CheckRealData } from "@/lib/checks-data";
import {
  getCheck,
  checkDetails,
  checkTrend,
  type Priority,
} from "@/lib/webdock";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const check = getCheck(id);
  return { title: `${check?.name ?? "チェック"} — Webドック` };
}

const PRIORITY_META: Record<Priority, { label: string; cls: string }> = {
  high: { label: "優先度：高", cls: "bg-red-50 text-red-600" },
  mid: { label: "優先度：中", cls: "bg-amber-50 text-amber-600" },
  low: { label: "優先度：低", cls: "bg-blue-50 text-blue-600" },
};

export default async function CheckDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const check = getCheck(id);
  const detail = checkDetails[id];
  if (!check || !detail) notFound();

  const { Icon, cls } = CHECK_ICONS[check.icon];

  // 設定のプリフィル
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: company } = await supabase
    .from("companies")
    .select("id")
    .eq("owner_id", user!.id)
    .maybeSingle();
  const { data: setting } = company
    ? await supabase
        .from("check_settings")
        .select("enabled, target_score, alert_threshold, frequency")
        .eq("company_id", company.id)
        .eq("check_key", id)
        .maybeSingle()
    : { data: null };

  const settings = {
    enabled: setting?.enabled ?? true,
    targetScore: setting?.target_score ?? 80,
    alertThreshold: setting?.alert_threshold ?? 60,
    frequency: setting?.frequency ?? "weekly",
  };

  // 実データ（連携済みソースがあれば実値を使用、無ければサンプル）
  const real: CheckRealData = company
    ? await getCheckRealData(company.id, id)
    : { isReal: false };
  const subMetrics = real.isReal && real.subMetrics ? real.subMetrics : detail.subMetrics;

  return (
    <div className="space-y-5">
      {/* 戻る */}
      <Link
        href="/checks"
        className="inline-flex items-center gap-1 text-sm font-medium text-muted transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        チェック結果一覧へ
      </Link>

      {/* ヘッダー */}
      <div className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${cls}`}>
              <Icon className="h-6 w-6" strokeWidth={2} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">{check.name}</h1>
              <p className="text-sm text-muted">{check.subtitle}</p>
            </div>
          </div>
          <button className="inline-flex shrink-0 items-center gap-2 self-start rounded-full bg-navy px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-navy/90 sm:self-auto">
            <RefreshCw className="h-4 w-4" />
            再チェック
          </button>
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-x-8 gap-y-3 border-t border-border pt-4">
          <div>
            <p className="text-xs text-muted">スコア</p>
            <p className="leading-none">
              <span className="text-3xl font-bold text-good">{check.score}</span>
              <span className="ml-1 text-sm text-muted">/ 100</span>
            </p>
          </div>
          <div>
            <p className="mb-1 text-xs text-muted">状態</p>
            <StatusBadge status={check.status} />
          </div>
          <div>
            <p className="mb-1 text-xs text-muted">前回比</p>
            <Delta value={check.delta} />
          </div>
          <div>
            <p className="text-xs text-muted">最終チェック</p>
            <p className="text-sm font-medium text-foreground">{check.lastCheck}</p>
          </div>
        </div>
      </div>

      {/* 本体 2カラム */}
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
        {/* 左 */}
        <div className="space-y-5 xl:col-span-2">
          {/* サマリー */}
          <div className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
            <p className="text-sm leading-relaxed text-foreground">{detail.summary}</p>
          </div>

          {/* 推移 */}
          <ScoreTrendChart data={checkTrend(check.score)} title="スコアの推移" />

          {/* サブ指標 */}
          <div className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between gap-2">
              <h2 className="text-base font-bold text-foreground">指標の内訳</h2>
              {real.isReal ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-600">
                  <Zap className="h-3 w-3" />
                  実データ{real.lastSync ? `・${real.lastSync}` : ""}
                </span>
              ) : real.sourceName ? (
                <Link
                  href="/sources"
                  className="inline-flex items-center gap-1 rounded-full bg-surface-2 px-2.5 py-1 text-[11px] font-medium text-muted transition-colors hover:text-foreground"
                >
                  サンプル・{real.sourceName}連携で実データに →
                </Link>
              ) : (
                <span className="rounded-full bg-surface-2 px-2.5 py-1 text-[11px] font-medium text-muted">
                  サンプル
                </span>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {subMetrics.map((m) => (
                <div key={m.label} className="rounded-xl bg-surface-2 p-3">
                  <p className="text-xs text-muted">{m.label}</p>
                  <p className="mt-1 text-lg font-bold text-foreground">{m.value}</p>
                  {m.sub && <p className="mt-0.5 text-[11px] text-muted">{m.sub}</p>}
                </div>
              ))}
            </div>
          </div>

          {/* 診断 */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
              <h3 className="mb-3 text-sm font-bold text-good">良い点</h3>
              <ul className="space-y-2">
                {detail.goodPoints.length === 0 && (
                  <li className="text-xs text-muted">特になし</li>
                )}
                {detail.goodPoints.map((p, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-foreground">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-good" />
                    {p}
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
              <h3 className="mb-3 text-sm font-bold text-warn">改善点</h3>
              <ul className="space-y-2">
                {detail.improvePoints.length === 0 && (
                  <li className="text-xs text-muted">改善点はありません 🎉</li>
                )}
                {detail.improvePoints.map((p, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-foreground">
                    <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-warn" />
                    {p}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* おすすめアクション */}
          {detail.actions.length > 0 && (
            <div className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
              <h2 className="mb-3 text-base font-bold text-foreground">おすすめアクション</h2>
              <ul className="space-y-2.5">
                {detail.actions.map((a, i) => {
                  const meta = PRIORITY_META[a.priority];
                  return (
                    <li
                      key={i}
                      className="flex items-center gap-3 rounded-xl bg-surface-2 px-3.5 py-3"
                    >
                      <ArrowRight className="h-4 w-4 shrink-0 text-good" />
                      <span className="flex-1 text-sm text-foreground">{a.text}</span>
                      <span className={`shrink-0 rounded-md px-2 py-0.5 text-[11px] font-bold ${meta.cls}`}>
                        {meta.label}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </div>

        {/* 右: 設定 */}
        <div className="xl:col-span-1">
          <CheckSettingsForm checkKey={id} initial={settings} />
        </div>
      </div>
    </div>
  );
}

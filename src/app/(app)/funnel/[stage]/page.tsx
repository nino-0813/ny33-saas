import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Calculator,
  CheckCircle2,
  Database,
  ExternalLink,
  Lightbulb,
  Newspaper,
  Target,
} from "lucide-react";
import { getFunnelData } from "@/lib/funnel-data";
import {
  FUNNEL_KEYS,
  getFunnelInsight,
  isFunnelKey,
  type FunnelKey,
} from "@/lib/funnel-insights";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ stage: string }>;
}): Promise<Metadata> {
  const { stage } = await params;
  if (!isFunnelKey(stage)) return { title: "ファネル評価 — Webドック" };
  const insight = getFunnelInsight(stage);
  return { title: `${insight.name}の評価 — Webドック` };
}

export default async function FunnelStagePage({
  params,
}: {
  params: Promise<{ stage: string }>;
}) {
  const { stage } = await params;
  if (!isFunnelKey(stage)) notFound();

  const funnel = await getFunnelData();
  const insight = getFunnelInsight(stage, funnel.signals);
  const score = Math.round(
    (funnel.stages?.find((item) => item.key === stage)?.rate ?? 0) * 100,
  );
  const currentIndex = FUNNEL_KEYS.indexOf(stage);

  return (
    <div className="mx-auto max-w-6xl space-y-5 pb-8 pt-2">
      <Link
        href="/"
        className="inline-flex min-h-10 items-center gap-2 rounded-xl px-3 text-sm font-bold text-muted transition-colors hover:bg-surface hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        集客ファネルに戻る
      </Link>

      <header className="relative overflow-hidden rounded-3xl border border-[#b9dce8] bg-surface p-6 shadow-sm sm:p-8">
        <div
          aria-hidden
          className="absolute -right-20 -top-28 h-64 w-64 rounded-full bg-[#dff3f8] blur-3xl"
        />
        <div className="relative flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-bold tracking-[0.16em] text-[#4b96b1]">
              FUNNEL INSIGHT
            </p>
            <h1 className="mt-2 text-3xl font-bold text-foreground">
              {insight.name}
            </h1>
            <p className="mt-2 text-base text-muted">{insight.question}</p>
          </div>
          <div className="flex items-end gap-2">
            <span className="tnum text-5xl font-bold text-[#347f9b]">{score}</span>
            <span className="pb-1 text-sm font-bold text-muted">/ 100</span>
          </div>
        </div>
      </header>

      {!funnel.connected && (
        <div className="rounded-2xl border border-[#b9dce8] bg-[#eef8fb] px-5 py-4 text-sm text-[#286d87]">
          Googleデータを取得できないため、現在は評価方法のみ表示しています。設定・連携からGA4とSearch
          Consoleを接続すると実数値が入ります。
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)]">
        <div className="space-y-5">
          <section className="rounded-3xl border border-border bg-surface p-6 shadow-sm">
            <div className="mb-5 flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#e7f5f9] text-[#347f9b]">
                <Database className="h-5 w-5" />
              </span>
              <div>
                <h2 className="font-bold text-foreground">実データでの評価</h2>
                <p className="text-xs text-muted">{insight.source}</p>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <Metric label="あなたの実績" value={insight.actual} emphasis />
              <Metric label="評価の目安" value={insight.target} />
            </div>

            <div className="mt-4 rounded-2xl bg-[#f5fafc] p-4 ring-1 ring-[#d5eaf1]">
              <div className="flex items-center gap-2 text-xs font-bold text-[#347f9b]">
                <Calculator className="h-4 w-4" />
                スコアの計算方法
              </div>
              <p className="tnum mt-2 text-lg font-bold text-foreground">
                {insight.formula}
              </p>
              <p className="mt-2 text-xs leading-relaxed text-muted">
                目安値に到達すると100点です。業種横断の簡易基準なので、今後は自社の過去実績や業界平均で調整できます。
              </p>
            </div>
          </section>

          <section className="rounded-3xl border border-border bg-surface p-6 shadow-sm">
            <div className="mb-4 flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#e7f5f9] text-[#347f9b]">
                <CheckCircle2 className="h-5 w-5" />
              </span>
              <h2 className="font-bold text-foreground">この数字から分かること</h2>
            </div>
            <p className="text-sm leading-7 text-foreground">{insight.summary}</p>
            <p className="mt-3 rounded-2xl bg-surface-2 px-4 py-3 text-sm font-bold leading-7 text-foreground">
              {insight.interpretation}
            </p>
          </section>
        </div>

        <aside className="space-y-5">
          <section className="rounded-3xl border border-border bg-surface p-6 shadow-sm">
            <div className="mb-4 flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#e7f5f9] text-[#347f9b]">
                <Lightbulb className="h-5 w-5" />
              </span>
              <h2 className="font-bold text-foreground">まず試す施策</h2>
            </div>
            <ol className="space-y-3">
              {insight.actions.map((action, index) => (
                <li
                  key={action.title}
                  className="flex gap-3 rounded-2xl border border-border/80 p-4"
                >
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#4b96b1] text-xs font-bold text-white">
                    {index + 1}
                  </span>
                  <div>
                    <p className="text-sm font-bold text-foreground">{action.title}</p>
                    <p className="mt-1 text-xs leading-5 text-muted">{action.detail}</p>
                  </div>
                </li>
              ))}
            </ol>
            <Link
              href={`/chat?topic=${stage}`}
              className="mt-4 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#4b96b1] px-4 text-sm font-bold text-white transition-colors hover:bg-[#347f9b]"
            >
              この評価について相談する
              <ArrowRight className="h-4 w-4" />
            </Link>
          </section>

          <section className="rounded-3xl border border-border bg-surface p-6 shadow-sm">
            <div className="mb-4 flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#e7f5f9] text-[#347f9b]">
                <Newspaper className="h-5 w-5" />
              </span>
              <div>
                <h2 className="font-bold text-foreground">最新情報・学び</h2>
                <p className="text-xs text-muted">信頼できる公式情報を優先</p>
              </div>
            </div>
            <div className="space-y-2">
              {insight.resources.map((resource) => (
                <a
                  key={resource.href}
                  href={resource.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex min-h-14 items-center justify-between gap-3 rounded-2xl border border-border/80 px-4 py-3 transition-colors hover:border-[#9bcddd] hover:bg-[#f5fafc]"
                >
                  <div>
                    <p className="text-sm font-bold leading-5 text-foreground">
                      {resource.title}
                    </p>
                    <p className="mt-1 text-[11px] text-muted">
                      {resource.source}
                      {resource.date ? `・${resource.date}` : ""}
                    </p>
                  </div>
                  <ExternalLink className="h-4 w-4 shrink-0 text-muted transition-colors group-hover:text-[#347f9b]" />
                </a>
              ))}
            </div>
          </section>
        </aside>
      </div>

      <nav
        aria-label="ファネルの段階"
        className="flex items-center justify-between rounded-2xl border border-border bg-surface p-3"
      >
        <StageLink
          stage={FUNNEL_KEYS[currentIndex - 1]}
          label="前の段階"
          direction="prev"
        />
        <span className="hidden items-center gap-2 text-xs font-bold text-muted sm:flex">
          <Target className="h-4 w-4" />
          {currentIndex + 1} / {FUNNEL_KEYS.length}段階
        </span>
        <StageLink
          stage={FUNNEL_KEYS[currentIndex + 1]}
          label="次の段階"
          direction="next"
        />
      </nav>
    </div>
  );
}

function Metric({
  label,
  value,
  emphasis = false,
}: {
  label: string;
  value: string;
  emphasis?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-border bg-surface-2/40 p-4">
      <p className="text-xs font-bold text-muted">{label}</p>
      <p
        className={`tnum mt-2 text-lg font-bold ${
          emphasis ? "text-[#347f9b]" : "text-foreground"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

function StageLink({
  stage,
  label,
  direction,
}: {
  stage?: FunnelKey;
  label: string;
  direction: "prev" | "next";
}) {
  if (!stage) return <span className="w-28" />;
  const insight = getFunnelInsight(stage);
  return (
    <Link
      href={`/funnel/${stage}`}
      className="inline-flex min-h-11 min-w-28 items-center justify-center gap-2 rounded-xl px-3 text-sm font-bold text-foreground transition-colors hover:bg-[#e7f5f9] hover:text-[#347f9b]"
    >
      {direction === "prev" && <ArrowLeft className="h-4 w-4" />}
      <span>
        <span className="block text-[10px] font-medium text-muted">{label}</span>
        {insight.name}
      </span>
      {direction === "next" && <ArrowRight className="h-4 w-4" />}
    </Link>
  );
}

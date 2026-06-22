"use client";

import { useMemo, useState } from "react";
import {
  ArrowDown,
  ArrowRight,
  Bot,
  Calculator,
  CheckCircle2,
  CircleDollarSign,
  Clock3,
  Lightbulb,
  Target,
  TrendingDown,
  Workflow,
} from "lucide-react";
import { Card } from "@/components/ui";

type Stage = {
  key: string;
  label: string;
  description: string;
  count: number;
  targetRate: number;
  aiAction: string;
};

const initialStages: Stage[] = [
  {
    key: "awareness",
    label: "認知",
    description: "広告・SNS・検索で知った人",
    count: 12000,
    targetRate: 25,
    aiAction: "広告クリエイティブ生成・投稿企画",
  },
  {
    key: "traffic",
    label: "流入",
    description: "Webサイトを訪れた人",
    count: 3000,
    targetRate: 55,
    aiAction: "SEO記事生成・広告配信最適化",
  },
  {
    key: "view",
    label: "商品閲覧",
    description: "商品・サービス詳細を見た人",
    count: 1350,
    targetRate: 8,
    aiAction: "レコメンド・導線／LP改善",
  },
  {
    key: "inquiry",
    label: "問い合わせ",
    description: "フォーム・電話・LINEで相談した人",
    count: 54,
    targetRate: 70,
    aiAction: "AIチャット・フォーム離脱防止",
  },
  {
    key: "reservation",
    label: "予約・商談",
    description: "予約または商談まで進んだ人",
    count: 32,
    targetRate: 65,
    aiAction: "自動返信・日程調整・追客",
  },
  {
    key: "purchase",
    label: "購入・成約",
    description: "実際に売上になった人",
    count: 18,
    targetRate: 30,
    aiAction: "商談支援・提案書／見積もり生成",
  },
  {
    key: "repeat",
    label: "リピート",
    description: "再購入・継続利用した人",
    count: 4,
    targetRate: 60,
    aiAction: "顧客別フォロー・再来店予測",
  },
  {
    key: "review",
    label: "口コミ",
    description: "口コミや紹介をしてくれた人",
    count: 2,
    targetRate: 50,
    aiAction: "口コミ依頼の自動送信・返信生成",
  },
];

type Bottleneck = {
  index: number;
  stage: Stage;
  previous: Stage;
  actualRate: number;
  gap: number;
  targetCount: number;
  opportunity: number;
};

function number(value: number) {
  return value.toLocaleString("ja-JP", { maximumFractionDigits: 1 });
}

function yen(value: number) {
  return `${Math.round(value).toLocaleString("ja-JP")}円`;
}

function percent(value: number) {
  return `${value.toLocaleString("ja-JP", { maximumFractionDigits: 1 })}%`;
}

export default function BusinessConsultingStudio() {
  const [stages, setStages] = useState(initialStages);
  const [grossProfit, setGrossProfit] = useState(80000);
  const [monthlyHours, setMonthlyHours] = useState(60);
  const [savedRate, setSavedRate] = useState(35);
  const [hourlyCost, setHourlyCost] = useState(2500);
  const [aiCost, setAiCost] = useState(50000);
  const [captureRate, setCaptureRate] = useState(30);

  const bottlenecks = useMemo<Bottleneck[]>(() => {
    return stages
      .slice(1)
      .map((stage, offset) => {
        const index = offset + 1;
        const previous = stages[index - 1];
        const actualRate = previous.count > 0 ? (stage.count / previous.count) * 100 : 0;
        const targetCount = Math.round(previous.count * (stage.targetRate / 100));
        return {
          index,
          stage,
          previous,
          actualRate,
          gap: stage.targetRate - actualRate,
          targetCount,
          opportunity: Math.max(0, targetCount - stage.count),
        };
      })
      .sort((a, b) => b.gap - a.gap);
  }, [stages]);

  const primary = bottlenecks[0];
  const savedHours = monthlyHours * (savedRate / 100);
  const laborBenefit = savedHours * hourlyCost;
  const addedCustomers =
    primary?.stage.key === "purchase"
      ? primary.opportunity * (captureRate / 100)
      : primary
        ? primary.opportunity *
          (captureRate / 100) *
          downstreamPurchaseRate(stages, primary.index)
        : 0;
  const profitBenefit = addedCustomers * grossProfit;
  const totalBenefit = laborBenefit + profitBenefit;
  const monthlyNet = totalBenefit - aiCost;
  const roi = aiCost > 0 ? (monthlyNet / aiCost) * 100 : 0;
  const payback = totalBenefit > 0 ? aiCost / totalBenefit : 0;

  function updateStage(index: number, field: "count" | "targetRate", value: number) {
    setStages((current) =>
      current.map((stage, stageIndex) =>
        stageIndex === index ? { ...stage, [field]: Math.max(0, value) } : stage,
      ),
    );
  }

  return (
    <div className="space-y-5">
      <div className="grid gap-4 md:grid-cols-3">
        <ConceptCard
          number="01"
          icon={<Workflow className="h-5 w-5" />}
          title="業務フローを分解"
          description="会社が認知から口コミまで、どう売上を作っているかを一枚で整理します。"
        />
        <ConceptCard
          number="02"
          icon={<TrendingDown className="h-5 w-5" />}
          title="課題を切り分け"
          description="流入不足なのか、問い合わせ後の対応なのか、最も大きな離脱を特定します。"
        />
        <ConceptCard
          number="03"
          icon={<Calculator className="h-5 w-5" />}
          title="ROIを数字で設計"
          description="削減時間と増加利益から、月間効果・ROI・回収期間を試算します。"
        />
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <Card className="overflow-hidden">
          <div className="border-b border-border px-5 py-4">
            <div className="flex items-center gap-2">
              <Workflow className="h-4 w-4 text-primary" />
              <h2 className="text-sm font-bold text-foreground">売上が生まれる業務フロー</h2>
            </div>
            <p className="mt-1 text-xs text-muted">
              各段階の月間人数と、次の段階へ進む目標率を入力してください。
            </p>
          </div>

          <div className="space-y-0 p-4 sm:p-5">
            {stages.map((stage, index) => {
              const previous = stages[index - 1];
              const conversion =
                previous && previous.count > 0 ? (stage.count / previous.count) * 100 : null;
              const gap =
                conversion === null ? null : stage.targetRate - conversion;
              return (
                <div key={stage.key}>
                  {index > 0 && (
                    <div className="grid min-h-14 grid-cols-[44px_1fr] items-center sm:grid-cols-[52px_1fr_180px]">
                      <div className="flex justify-center">
                        <ArrowDown className="h-4 w-4 text-muted" />
                      </div>
                      <div className="flex flex-wrap items-center gap-2 text-xs">
                        <span className="font-bold text-foreground">
                          実績 {conversion === null ? "—" : percent(conversion)}
                        </span>
                        <span className="text-muted">／ 目標 {percent(stage.targetRate)}</span>
                        {gap !== null && gap > 0.5 && (
                          <span className="rounded-full bg-bad-weak px-2 py-0.5 font-bold text-bad">
                            目標差 -{percent(gap)}
                          </span>
                        )}
                      </div>
                      <div className="hidden sm:block" />
                    </div>
                  )}

                  <div
                    className={`grid gap-3 rounded-xl border p-4 sm:grid-cols-[52px_minmax(0,1fr)_180px] sm:items-center ${
                      primary?.index === index
                        ? "border-bad/35 bg-bad-weak/35"
                        : "border-border bg-surface"
                    }`}
                  >
                    <span
                      className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold ${
                        primary?.index === index
                          ? "bg-bad text-white"
                          : "bg-primary-weak text-primary"
                      }`}
                    >
                      {index + 1}
                    </span>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-sm font-bold text-foreground">{stage.label}</h3>
                        {primary?.index === index && (
                          <span className="rounded-full bg-bad px-2 py-0.5 text-[10px] font-bold text-white">
                            最大のボトルネック
                          </span>
                        )}
                      </div>
                      <p className="mt-0.5 text-xs text-muted">{stage.description}</p>
                    </div>
                    <label className="block">
                      <span className="mb-1 block text-[11px] font-medium text-muted">
                        月間人数・件数
                      </span>
                      <input
                        type="number"
                        min={0}
                        value={stage.count}
                        onChange={(event) =>
                          updateStage(index, "count", Number(event.target.value))
                        }
                        className="h-11 w-full rounded-lg border border-border bg-surface px-3 text-right text-sm font-bold text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                      />
                    </label>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        <div className="space-y-5">
          {primary && (
            <Card className="overflow-hidden">
              <div className="bg-navy px-5 py-4 text-white">
                <div className="flex items-center gap-2">
                  <Target className="h-4 w-4 text-green-400" />
                  <h2 className="text-sm font-bold">最優先で改善する場所</h2>
                </div>
              </div>
              <div className="p-5">
                <p className="text-xs font-medium text-muted">
                  {primary.previous.label} → {primary.stage.label}
                </p>
                <p className="mt-1 text-xl font-bold text-foreground">
                  {primary.stage.label}への転換率が不足
                </p>
                <div className="mt-4 grid grid-cols-2 gap-3">
                  <MiniMetric label="現在" value={percent(primary.actualRate)} tone="bad" />
                  <MiniMetric label="目標" value={percent(primary.stage.targetRate)} tone="good" />
                </div>
                <div className="mt-4 rounded-xl bg-accent-weak/70 p-4">
                  <p className="text-xs font-bold text-warn">取りこぼしの目安</p>
                  <p className="tnum mt-1 text-2xl font-bold text-foreground">
                    月 {number(primary.opportunity)}件
                  </p>
                  <p className="mt-1 text-xs leading-relaxed text-muted">
                    目標率なら月{number(primary.targetCount)}件まで進む計算です。
                  </p>
                </div>
                <div className="mt-4 border-t border-border pt-4">
                  <p className="flex items-center gap-1.5 text-xs font-bold text-primary">
                    <Bot className="h-4 w-4" />
                    向いているAI施策
                  </p>
                  <p className="mt-2 text-sm font-bold text-foreground">
                    {primary.stage.aiAction}
                  </p>
                  <p className="mt-1 text-xs leading-relaxed text-muted">
                    まずこの工程だけで小さく実証し、改善率と工数削減を測るのが安全です。
                  </p>
                </div>
              </div>
            </Card>
          )}

          <Card className="p-5">
            <div className="mb-4 flex items-center gap-2">
              <Lightbulb className="h-4 w-4 text-accent" />
              <h2 className="text-sm font-bold text-foreground">課題の切り分け</h2>
            </div>
            <div className="space-y-3">
              {bottlenecks.slice(0, 3).map((item, rank) => (
                <div
                  key={item.stage.key}
                  className="flex items-start gap-3 rounded-xl bg-surface-2 p-3"
                >
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-navy text-xs font-bold text-white">
                    {rank + 1}
                  </span>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-foreground">
                      {item.previous.label} → {item.stage.label}
                    </p>
                    <p className="mt-0.5 text-xs text-muted">
                      目標まで {percent(Math.max(0, item.gap))}不足・月
                      {number(item.opportunity)}件の改善余地
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>

      <Card className="overflow-hidden">
        <div className="border-b border-border px-5 py-4">
          <div className="flex items-center gap-2">
            <CircleDollarSign className="h-5 w-5 text-primary" />
            <h2 className="text-base font-bold text-foreground">AI導入のROI設計</h2>
          </div>
          <p className="mt-1 text-xs text-muted">
            「便利そう」ではなく、月にいくら利益が増え、何か月で元が取れるかを試算します。
          </p>
        </div>

        <div className="grid gap-5 p-5 xl:grid-cols-[minmax(0,1fr)_420px]">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <NumberField
              label="対象業務の月間工数"
              value={monthlyHours}
              onChange={setMonthlyHours}
              suffix="時間"
              hint="問い合わせ対応、集計、追客など"
            />
            <NumberField
              label="AIによる削減率"
              value={savedRate}
              onChange={setSavedRate}
              suffix="%"
              max={100}
            />
            <NumberField
              label="担当者の時間単価"
              value={hourlyCost}
              onChange={setHourlyCost}
              suffix="円"
            />
            <NumberField
              label="1成約あたり粗利益"
              value={grossProfit}
              onChange={setGrossProfit}
              suffix="円"
            />
            <NumberField
              label="改善余地の獲得率"
              value={captureRate}
              onChange={setCaptureRate}
              suffix="%"
              max={100}
              hint="取りこぼしの何%を回収できるか"
            />
            <NumberField
              label="AIの月額費用"
              value={aiCost}
              onChange={setAiCost}
              suffix="円"
            />
          </div>

          <div className="rounded-2xl bg-navy p-5 text-white">
            <p className="text-xs font-bold text-white/60">ROIシミュレーション</p>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <DarkMetric
                label="削減できる時間"
                value={`${number(savedHours)}時間/月`}
                icon={<Clock3 className="h-4 w-4" />}
              />
              <DarkMetric
                label="増加成約の試算"
                value={`${number(addedCustomers)}件/月`}
                icon={<Target className="h-4 w-4" />}
              />
            </div>
            <div className="mt-4 space-y-2 border-y border-white/10 py-4 text-sm">
              <ResultRow label="人件費削減効果" value={`+${yen(laborBenefit)}`} />
              <ResultRow label="粗利益の増加" value={`+${yen(profitBenefit)}`} />
              <ResultRow label="AI月額費用" value={`-${yen(aiCost)}`} muted />
            </div>
            <div className="mt-4">
              <p className="text-xs text-white/60">月間の純効果</p>
              <p
                className={`tnum mt-1 text-3xl font-bold ${
                  monthlyNet >= 0 ? "text-green-400" : "text-red-300"
                }`}
              >
                {monthlyNet >= 0 ? "+" : ""}
                {yen(monthlyNet)}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-bold">
                  ROI {percent(roi)}
                </span>
                <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-bold">
                  回収期間 {payback > 0 ? `${number(payback)}か月` : "即時"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </Card>

      <div className="rounded-2xl border border-primary/20 bg-primary-weak/40 p-5">
        <div className="flex items-start gap-3">
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
          <div>
            <h2 className="text-sm font-bold text-foreground">FDEの進め方</h2>
            <div className="mt-3 flex flex-col gap-2 text-xs text-muted sm:flex-row sm:items-center">
              <Step label="業務を図にする" />
              <ArrowRight className="hidden h-4 w-4 sm:block" />
              <Step label="数字で詰まりを特定" />
              <ArrowRight className="hidden h-4 w-4 sm:block" />
              <Step label="小さくAIを実証" />
              <ArrowRight className="hidden h-4 w-4 sm:block" />
              <Step label="ROIを測って拡張" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function downstreamPurchaseRate(stages: Stage[], startIndex: number) {
  const purchaseIndex = stages.findIndex((stage) => stage.key === "purchase");
  if (purchaseIndex <= startIndex) return 1;
  let rate = 1;
  for (let index = startIndex + 1; index <= purchaseIndex; index += 1) {
    const previous = stages[index - 1];
    const current = stages[index];
    rate *= previous.count > 0 ? Math.min(1, current.count / previous.count) : 0;
  }
  return rate;
}

function ConceptCard({
  number: stepNumber,
  icon,
  title,
  description,
}: {
  number: string;
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-weak text-primary">
          {icon}
        </span>
        <span className="text-xs font-bold text-muted">{stepNumber}</span>
      </div>
      <h2 className="mt-4 text-sm font-bold text-foreground">{title}</h2>
      <p className="mt-1 text-xs leading-relaxed text-muted">{description}</p>
    </Card>
  );
}

function MiniMetric({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "good" | "bad";
}) {
  return (
    <div className={tone === "good" ? "rounded-xl bg-good-weak p-3" : "rounded-xl bg-bad-weak p-3"}>
      <p className={tone === "good" ? "text-xs text-good" : "text-xs text-bad"}>
        {label}
      </p>
      <p className={tone === "good" ? "tnum mt-1 text-xl font-bold text-good" : "tnum mt-1 text-xl font-bold text-bad"}>
        {value}
      </p>
    </div>
  );
}

function NumberField({
  label,
  value,
  onChange,
  suffix,
  hint,
  max,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  suffix: string;
  hint?: string;
  max?: number;
}) {
  return (
    <label className="block rounded-xl border border-border bg-surface p-4">
      <span className="block text-xs font-bold text-foreground">{label}</span>
      {hint && <span className="mt-0.5 block text-[11px] text-muted">{hint}</span>}
      <span className="relative mt-3 block">
        <input
          type="number"
          min={0}
          max={max}
          value={value}
          onChange={(event) =>
            onChange(Math.max(0, max ? Math.min(max, Number(event.target.value)) : Number(event.target.value)))
          }
          className="h-11 w-full rounded-lg border border-border bg-surface px-3 pr-14 text-right text-sm font-bold text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
        />
        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted">
          {suffix}
        </span>
      </span>
    </label>
  );
}

function DarkMetric({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-xl bg-white/[0.07] p-3">
      <div className="flex items-center gap-1.5 text-white/60">
        {icon}
        <p className="text-[11px]">{label}</p>
      </div>
      <p className="tnum mt-2 text-base font-bold text-white">{value}</p>
    </div>
  );
}

function ResultRow({
  label,
  value,
  muted = false,
}: {
  label: string;
  value: string;
  muted?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-white/60">{label}</span>
      <span className={`tnum font-bold ${muted ? "text-white/70" : "text-green-400"}`}>
        {value}
      </span>
    </div>
  );
}

function Step({ label }: { label: string }) {
  return (
    <span className="rounded-lg bg-surface px-3 py-2 font-bold text-foreground ring-1 ring-border">
      {label}
    </span>
  );
}

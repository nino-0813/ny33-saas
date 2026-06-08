"use client";

import {
  RadialBarChart,
  RadialBar,
  PolarAngleAxis,
  ResponsiveContainer,
} from "recharts";
import { TrendingUp, ArrowUpRight } from "lucide-react";
import { Card, RankChip } from "./ui";
import { yen, type HealthScore as HealthScoreData } from "@/lib/mock";

function barColor(score: number) {
  if (score >= 75) return "var(--good)";
  if (score >= 60) return "var(--primary)";
  if (score >= 45) return "var(--warn)";
  return "var(--bad)";
}

export default function HealthScore({
  health,
  delta = 0,
}: {
  health: HealthScoreData;
  delta?: number;
}) {
  const { score, rank, improvementYen, breakdown } = health;
  const gaugeData = [{ name: "health", value: score, fill: barColor(score) }];

  return (
    <Card className="flex h-full flex-col p-5">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-bold text-foreground">会社健康度</h2>
        <RankChip rank={rank} />
      </div>

      {/* ゲージ */}
      <div className="relative mx-auto my-1 h-44 w-full max-w-[220px]">
        <ResponsiveContainer width="100%" height="100%">
          <RadialBarChart
            innerRadius="76%"
            outerRadius="100%"
            data={gaugeData}
            startAngle={220}
            endAngle={-40}
          >
            <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
            <RadialBar
              background={{ fill: "var(--surface-2)" }}
              dataKey="value"
              cornerRadius={12}
              isAnimationActive
            />
          </RadialBarChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="tnum text-5xl font-bold leading-none text-foreground">
            {score}
          </span>
          <span className="mt-1 text-xs text-muted">/ 100点</span>
          <span className="mt-1 inline-flex items-center gap-0.5 text-xs font-bold text-good">
            <ArrowUpRight className="h-3.5 w-3.5" />
            前月比 +{delta}点
          </span>
        </div>
      </div>

      {/* 利益改善予測 */}
      <div className="mb-4 flex items-center gap-3 rounded-lg bg-accent-weak px-3 py-2.5">
        <TrendingUp className="h-5 w-5 shrink-0 text-accent" />
        <div>
          <p className="text-[11px] font-medium text-accent/80">利益改善の余地</p>
          <p className="tnum text-base font-bold text-accent">
            +{yen(improvementYen)} / 月
          </p>
        </div>
      </div>

      {/* カテゴリ別 */}
      <div className="flex flex-col gap-2.5">
        {breakdown.map((b) => (
          <div key={b.label}>
            <div className="mb-1 flex items-center justify-between text-xs">
              <span className="font-medium text-foreground">{b.label}</span>
              <span className="tnum font-bold text-muted">{b.score}</span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-2">
              <div
                className="h-full rounded-full transition-[width] duration-500"
                style={{ width: `${b.score}%`, background: barColor(b.score) }}
              />
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

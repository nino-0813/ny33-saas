"use client";

import { Area, AreaChart, ResponsiveContainer } from "recharts";
import { ArrowUpRight, ArrowDownRight, Minus } from "lucide-react";
import { Card } from "./ui";
import { type Kpi, type Trend } from "@/lib/mock";

const trendColor: Record<Trend, string> = {
  up: "var(--good)",
  down: "var(--bad)",
  flat: "var(--muted)",
};

function TrendIcon({ trend }: { trend: Trend }) {
  const cls = "h-3.5 w-3.5";
  if (trend === "up") return <ArrowUpRight className={cls} />;
  if (trend === "down") return <ArrowDownRight className={cls} />;
  return <Minus className={cls} />;
}

function Spark({ data, trend }: { data: number[]; trend: Trend }) {
  const chartData = data.map((v, i) => ({ i, v }));
  const color = trendColor[trend];
  return (
    <div className="h-10 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 2, bottom: 2, left: 0, right: 0 }}>
          <defs>
            <linearGradient id={`spark-${trend}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.25} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area
            type="monotone"
            dataKey="v"
            stroke={color}
            strokeWidth={2}
            fill={`url(#spark-${trend})`}
            isAnimationActive={false}
            dot={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

function KpiCard({ kpi }: { kpi: Kpi }) {
  return (
    <Card className="p-4">
      <p className="text-xs font-medium text-muted">{kpi.label}</p>
      <div className="mt-1 flex items-baseline gap-1">
        <span className="tnum text-2xl font-bold text-foreground">{kpi.value}</span>
        {kpi.unit && <span className="text-sm font-medium text-muted">{kpi.unit}</span>}
      </div>
      <div
        className="mt-1 inline-flex items-center gap-1 text-xs font-bold"
        style={{ color: trendColor[kpi.trend] }}
      >
        <TrendIcon trend={kpi.trend} />
        {kpi.deltaLabel}
      </div>
      <Spark data={kpi.spark} trend={kpi.trend} />
    </Card>
  );
}

export default function KpiGrid({ kpis }: { kpis: Kpi[] }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
      {kpis.map((kpi) => (
        <KpiCard key={kpi.id} kpi={kpi} />
      ))}
    </div>
  );
}

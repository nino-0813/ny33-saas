"use client";

import { Area, AreaChart, ResponsiveContainer } from "recharts";
import { UXB } from "./uxb";
import type { Kpi, Trend } from "@/lib/mock";

const trendMeta: Record<
  Trend,
  { color: string; pill: string; pillCls: string }
> = {
  up: { color: UXB.emerald, pill: "GOOD", pillCls: "bg-primary text-white" },
  down: { color: UXB.orange, pill: "注意", pillCls: "bg-orange-500 text-white" },
  flat: { color: "#9ca3af", pill: "—", pillCls: "bg-gray-200 text-gray-600" },
};

function Spark({ data, color }: { data: number[]; color: string }) {
  const chartData = data.map((v, i) => ({ i, v }));
  const id = `uxb-spark-${color.replace("#", "")}`;
  return (
    <div className="h-9 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 2, bottom: 0, left: 0, right: 0 }}>
          <defs>
            <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.2} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area
            type="monotone"
            dataKey="v"
            stroke={color}
            strokeWidth={2}
            fill={`url(#${id})`}
            dot={false}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

function KpiCard({ kpi }: { kpi: Kpi }) {
  const meta = trendMeta[kpi.trend];
  return (
    <div className="rounded-2xl bg-white p-3.5 shadow-sm ring-1 ring-black/[0.04] sm:p-4">
      <div className="mb-1 flex items-center justify-between gap-2">
        <span className="truncate text-[11px] font-medium text-gray-500 sm:text-xs">
          {kpi.label}
        </span>
        <span
          className={`shrink-0 rounded-full px-2 py-0.5 text-[9px] font-semibold sm:text-[10px] ${meta.pillCls}`}
        >
          {meta.pill}
        </span>
      </div>
      <div className="flex items-baseline gap-1">
        <span className="font-uxb text-2xl font-bold text-black sm:text-3xl">
          {kpi.value}
        </span>
        {kpi.unit && (
          <span className="text-xs font-medium text-gray-400">{kpi.unit}</span>
        )}
      </div>
      <p className="mt-0.5 text-[10px] font-medium text-gray-500 sm:text-[11px]">
        {kpi.deltaLabel}
      </p>
      <Spark data={kpi.spark} color={meta.color} />
    </div>
  );
}

export default function KpiStats({ kpis }: { kpis: Kpi[] }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
      {kpis.map((k) => (
        <KpiCard key={k.id} kpi={k} />
      ))}
    </div>
  );
}

"use client";

import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Card } from "./ui";
import { type KarteEntry } from "@/lib/mock";

interface TooltipEntry {
  name: string;
  value: number;
  color: string;
  dataKey: string;
}

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: TooltipEntry[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  const unit = (k: string) => (k === "health" ? "点" : "万円");
  return (
    <div className="rounded-lg border border-border bg-surface px-3 py-2 text-xs shadow-md">
      <p className="mb-1 font-bold text-foreground">{label}</p>
      {payload.map((e) => (
        <p key={e.dataKey} className="tnum flex items-center gap-2" style={{ color: e.color }}>
          <span className="font-medium">{e.name}</span>
          <span className="ml-auto font-bold">
            {e.value}
            {unit(e.dataKey)}
          </span>
        </p>
      ))}
    </div>
  );
}

export default function KarteChart({ karte }: { karte: KarteEntry[] }) {
  const data = karte.map((k) => ({
    ...k,
    label: `${Number(k.month.slice(5))}月`,
  }));

  return (
    <Card className="p-5">
      <div className="mb-4 flex items-end justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-foreground">会社カルテ（推移）</h2>
          <p className="mt-0.5 text-xs text-muted">
            毎月の売上・利益・健康度を記録。10か月で健康度 52 → 78 点
          </p>
        </div>
      </div>

      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
            <CartesianGrid stroke="var(--border)" vertical={false} />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 12, fill: "var(--muted)" }}
              axisLine={{ stroke: "var(--border)" }}
              tickLine={false}
            />
            <YAxis
              yAxisId="left"
              tick={{ fontSize: 12, fill: "var(--muted)" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              domain={[0, 100]}
              tick={{ fontSize: 12, fill: "var(--muted)" }}
              axisLine={false}
              tickLine={false}
              width={32}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: "var(--surface-2)" }} />
            <Legend
              wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
              iconType="circle"
              iconSize={8}
            />
            <Bar
              yAxisId="left"
              dataKey="sales"
              name="売上"
              fill="var(--primary-weak)"
              stroke="var(--primary)"
              strokeWidth={1}
              radius={[4, 4, 0, 0]}
              barSize={18}
              isAnimationActive={false}
            />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="profit"
              name="利益"
              stroke="var(--accent)"
              strokeWidth={2.5}
              dot={{ r: 3 }}
              isAnimationActive={false}
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="health"
              name="健康度"
              stroke="var(--good)"
              strokeWidth={2.5}
              strokeDasharray="4 3"
              dot={{ r: 3 }}
              isAnimationActive={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}

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
import { UxbCard, CardHead, UXB } from "./uxb";
import type { KarteEntry } from "@/lib/mock";

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
    <div className="rounded-xl border border-gray-100 bg-white px-3 py-2 text-xs shadow-lg">
      <p className="mb-1 font-semibold text-black">{label}</p>
      {payload.map((e) => (
        <p key={e.dataKey} className="flex items-center gap-2" style={{ color: e.color }}>
          <span className="font-medium">{e.name}</span>
          <span className="font-uxb ml-auto font-bold">
            {e.value}
            {unit(e.dataKey)}
          </span>
        </p>
      ))}
    </div>
  );
}

export default function KarteAreaChart({ karte }: { karte: KarteEntry[] }) {
  const data = karte.map((k) => ({
    ...k,
    label: `${Number(k.month.slice(5))}月`,
  }));

  return (
    <UxbCard>
      <CardHead title="会社カルテ（推移）" />
      <p className="-mt-2 mb-3 text-xs text-gray-500">
        売上・利益・健康度の {karte.length} か月推移
      </p>
      <div className="h-64 w-full sm:h-72">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -18 }}>
            <CartesianGrid stroke="#f0f0f0" vertical={false} />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 11, fill: "#9ca3af" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              yAxisId="left"
              tick={{ fontSize: 11, fill: "#9ca3af" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              domain={[0, 100]}
              tick={{ fontSize: 11, fill: "#9ca3af" }}
              axisLine={false}
              tickLine={false}
              width={28}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: "#f5f5f5" }} />
            <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }} iconType="circle" iconSize={8} />
            <Bar
              yAxisId="left"
              dataKey="sales"
              name="売上"
              fill="#e5e7eb"
              radius={[4, 4, 0, 0]}
              barSize={16}
              isAnimationActive={false}
            />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="profit"
              name="利益"
              stroke={UXB.orange}
              strokeWidth={2.5}
              dot={{ r: 3, fill: UXB.orange }}
              isAnimationActive={false}
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="health"
              name="健康度"
              stroke={UXB.emerald}
              strokeWidth={2.5}
              dot={{ r: 3, fill: UXB.emerald }}
              isAnimationActive={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </UxbCard>
  );
}

"use client";

import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  ResponsiveContainer,
} from "recharts";
import { UxbCard, CardHead, scoreColor, UXB } from "./uxb";
import type { HealthScore } from "@/lib/mock";

export default function HealthRadar({
  health,
  rankLabel,
}: {
  health: HealthScore;
  rankLabel: string;
}) {
  const { score, breakdown } = health;

  return (
    <UxbCard>
      <CardHead title="会社健康度" />

      {/* スコア */}
      <div className="mb-1 flex items-end gap-2">
        <span className="font-uxb text-4xl font-bold leading-none text-black sm:text-5xl">
          {score}
        </span>
        <span className="mb-1 text-xs text-gray-500">/ 100</span>
        <span className="mb-1 ml-auto rounded-full bg-emerald-500 px-2.5 py-0.5 text-xs font-semibold text-white">
          {rankLabel}ランク
        </span>
      </div>

      {/* レーダー */}
      <div className="relative mb-3 h-44 w-full sm:h-52">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={breakdown} outerRadius="72%">
            <PolarGrid stroke="#e5e5e5" />
            <PolarAngleAxis
              dataKey="label"
              tick={{ fontSize: 11, fill: "#6b7280" }}
            />
            <Radar
              dataKey="score"
              stroke={UXB.emerald}
              fill={UXB.emerald}
              fillOpacity={0.15}
              strokeWidth={2}
              isAnimationActive={false}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>

      {/* 指標リスト */}
      <div className="space-y-2.5">
        {breakdown.map((b, i) => (
          <div key={b.label} className="flex items-center gap-2">
            <span className="w-3 text-xs font-medium text-gray-500">
              {i + 1}
            </span>
            <span className="flex-1 text-xs text-black">{b.label}</span>
            <div className="flex items-center gap-1.5">
              <div className="h-1.5 w-12 overflow-hidden rounded-full bg-gray-100">
                <div
                  className="h-full rounded-full"
                  style={{ width: `${b.score}%`, background: scoreColor(b.score) }}
                />
              </div>
              <span className="w-8 text-right text-xs font-semibold text-black">
                {b.score}%
              </span>
            </div>
          </div>
        ))}
      </div>
    </UxbCard>
  );
}

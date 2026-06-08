import { Trophy } from "lucide-react";
import { Card } from "./ui";
import { type CompetitorRow } from "@/lib/mock";

interface CompetitorData {
  area: string;
  total: number;
  rows: CompetitorRow[];
}

const statusMeta: Record<CompetitorRow["status"], { label: string; cls: string; bar: string }> = {
  good: { label: "上位", cls: "text-good", bar: "var(--good)" },
  warn: { label: "平均的", cls: "text-warn", bar: "var(--warn)" },
  bad: { label: "要改善", cls: "text-bad", bar: "var(--bad)" },
};

export default function Competitor({ competitor }: { competitor: CompetitorData }) {
  return (
    <Card className="flex h-full flex-col p-5">
      <div className="mb-1 flex items-center gap-2">
        <Trophy className="h-4 w-4 text-accent" />
        <h2 className="text-base font-bold text-foreground">競合比較</h2>
      </div>
      <p className="mb-4 text-xs text-muted">
        {competitor.area}（全{competitor.total}社中）での自社ポジション
      </p>

      <div className="flex flex-col gap-4">
        {competitor.rows.map((row) => {
          const meta = statusMeta[row.status];
          // 上位ほどバーを長く（1位=100%）
          const pct = Math.round(
            (1 - (row.rankInArea - 1) / row.totalInArea) * 100
          );
          return (
            <div key={row.label}>
              <div className="mb-1.5 flex items-center justify-between gap-2 text-xs">
                <span className="font-medium text-foreground">{row.label}</span>
                <span className="tnum text-muted">
                  {row.ours}・
                  <span className={`font-bold ${meta.cls}`}>
                    {row.rankInArea}位
                  </span>
                  <span className="text-muted">/{row.totalInArea}社</span>
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-surface-2">
                  <div
                    className="h-full rounded-full transition-[width] duration-500"
                    style={{ width: `${pct}%`, background: meta.bar }}
                  />
                </div>
                <span
                  className={`w-12 shrink-0 text-right text-[11px] font-bold ${meta.cls}`}
                >
                  {meta.label}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <p className="mt-auto pt-4 text-[11px] leading-relaxed text-muted">
        ※ 口コミ数が地域32位と低く、最優先の改善ポイントです。
      </p>
    </Card>
  );
}

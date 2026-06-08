import { Users, TrendingUp, TrendingDown } from "lucide-react";
import { redirect } from "next/navigation";
import { PageHeader, Card, SectionTitle } from "@/components/ui";
import Competitor from "@/components/Competitor";
import { type CompareMetric } from "@/lib/mock";
import { getDashboardData } from "@/lib/queries";

export const metadata = { title: "競合比較 — NY33 Company Dock" };

function fmt(n: number, unit: string) {
  return `${n.toLocaleString("ja-JP")}${unit}`;
}

/** バー幅（0-100）。順位は小さいほど良いので反転 */
function widths(m: CompareMetric) {
  if (m.higherIsBetter) {
    const max = Math.max(m.ours, m.industryAvg, m.top);
    return {
      ours: (m.ours / max) * 100,
      avg: (m.industryAvg / max) * 100,
      top: (m.top / max) * 100,
    };
  }
  const best = Math.min(m.ours, m.industryAvg, m.top); // = top
  return {
    ours: (best / m.ours) * 100,
    avg: (best / m.industryAvg) * 100,
    top: 100,
  };
}

/** 業界平均より良いか */
function beatsAvg(m: CompareMetric) {
  return m.higherIsBetter ? m.ours > m.industryAvg : m.ours < m.industryAvg;
}

function CompareRow({ m }: { m: CompareMetric }) {
  const w = widths(m);
  const good = beatsAvg(m);
  const Bar = ({
    label,
    value,
    width,
    color,
  }: {
    label: string;
    value: number;
    width: number;
    color: string;
  }) => (
    <div className="flex items-center gap-3">
      <span className="w-20 shrink-0 text-[11px] text-muted">{label}</span>
      <div className="h-5 flex-1 overflow-hidden rounded-md bg-surface-2">
        <div
          className="flex h-full items-center justify-end rounded-md px-2 transition-[width] duration-500"
          style={{ width: `${Math.max(width, 12)}%`, background: color }}
        >
          <span className="tnum text-[11px] font-bold text-white">
            {fmt(value, m.unit)}
          </span>
        </div>
      </div>
    </div>
  );

  return (
    <Card className="p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h3 className="text-sm font-bold text-foreground">{m.label}</h3>
        <span
          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold ${
            good ? "bg-good-weak text-good" : "bg-bad-weak text-bad"
          }`}
        >
          {good ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
          {good ? "業界平均より上" : "業界平均より下"}
        </span>
      </div>
      <div className="space-y-2">
        <Bar label="自社" value={m.ours} width={w.ours} color="var(--primary)" />
        <Bar label="業界平均" value={m.industryAvg} width={w.avg} color="var(--muted)" />
        <Bar label="業界トップ" value={m.top} width={w.top} color="var(--navy)" />
      </div>
    </Card>
  );
}

export default async function CompetitorPage() {
  const data = await getDashboardData();
  if (!data) redirect("/onboarding");
  const { competitor, compareMetrics } = data;
  const beaten = compareMetrics.filter((m) => !beatsAvg(m)).length;

  return (
    <div className="space-y-8">
      <PageHeader
        icon={<Users className="h-5 w-5" />}
        title="競合比較"
        description={`${competitor.area}（全${competitor.total}社）の中での自社ポジションと、業界平均・トップとの差分を可視化します。`}
      />

      {/* サマリー */}
      <Card className="flex items-center gap-4 border-warn/30 bg-warn-weak/40 p-4">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-warn/15 text-warn">
          <TrendingDown className="h-5 w-5" />
        </div>
        <p className="text-sm text-foreground">
          <span className="font-bold">{beaten}項目</span>が業界平均を下回っています。
          特に<span className="font-bold text-bad">Google口コミ数（地域32位）</span>が最優先の改善ポイントです。
        </p>
      </Card>

      {/* 地域内ランキング */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Competitor competitor={competitor} />

        {/* 改善余地の高い指標 */}
        <Card className="flex h-full flex-col p-5">
          <h2 className="text-base font-bold text-foreground">トップとの差分</h2>
          <p className="mb-4 text-xs text-muted">業界トップに追いつくための伸びしろ</p>
          <div className="flex flex-col gap-3">
            {compareMetrics
              .filter((m) => m.higherIsBetter)
              .map((m) => {
                const gap = Math.round((1 - m.ours / m.top) * 100);
                return (
                  <div key={m.label} className="flex items-center justify-between gap-3">
                    <span className="text-sm text-foreground">{m.label}</span>
                    <span className="tnum text-xs text-muted">
                      自社 {fmt(m.ours, m.unit)} / トップ {fmt(m.top, m.unit)}
                    </span>
                    <span className="tnum w-16 shrink-0 text-right text-sm font-bold text-accent">
                      -{gap}%
                    </span>
                  </div>
                );
              })}
          </div>
        </Card>
      </div>

      {/* 指標別の詳細比較 */}
      <section>
        <SectionTitle title="指標別の詳細比較" subtitle="自社・業界平均・業界トップ" />
        <div className="grid gap-3 md:grid-cols-2">
          {compareMetrics.map((m) => (
            <CompareRow key={m.label} m={m} />
          ))}
        </div>
      </section>
    </div>
  );
}

import { FileText, ArrowUpRight, ArrowDownRight, Minus } from "lucide-react";
import { redirect } from "next/navigation";
import { PageHeader, Card, RankChip, SectionTitle } from "@/components/ui";
import KarteChart from "@/components/KarteChart";
import { rankFromScore, yen } from "@/lib/mock";
import { getDashboardData } from "@/lib/queries";

export const metadata = { title: "会社カルテ — NY33 Company Dock" };

function Delta({ value, suffix = "" }: { value: number; suffix?: string }) {
  const Icon = value > 0 ? ArrowUpRight : value < 0 ? ArrowDownRight : Minus;
  const cls = value > 0 ? "text-good" : value < 0 ? "text-bad" : "text-muted";
  const sign = value > 0 ? "+" : "";
  return (
    <span className={`tnum inline-flex items-center gap-0.5 text-xs font-bold ${cls}`}>
      <Icon className="h-3 w-3" />
      {sign}
      {value}
      {suffix}
    </span>
  );
}

export default async function KartePage() {
  const data = await getDashboardData();
  if (!data) redirect("/onboarding");
  const karte = data.karte;

  // 新しい月が上に来るよう降順
  const rows = [...karte].reverse();
  const latest = karte[karte.length - 1];
  const prev = karte[karte.length - 2];

  return (
    <div className="space-y-8">
      <PageHeader
        icon={<FileText className="h-5 w-5" />}
        title="会社カルテ"
        description="毎月の売上・利益・会社健康度を記録した、あなたの会社の診断履歴です。船のドック点検のように、変化を時系列で振り返れます。"
      />

      {/* 今月のカルテ */}
      <section>
        <SectionTitle title="今月のカルテ（2026年6月）" />
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Card className="p-4">
            <p className="text-xs font-medium text-muted">売上</p>
            <p className="tnum mt-1 text-2xl font-bold text-foreground">
              {latest.sales}
              <span className="ml-1 text-sm text-muted">万円</span>
            </p>
            <div className="mt-1">
              <Delta value={latest.sales - prev.sales} suffix="万円" />
            </div>
          </Card>
          <Card className="p-4">
            <p className="text-xs font-medium text-muted">利益</p>
            <p className="tnum mt-1 text-2xl font-bold text-foreground">
              {latest.profit}
              <span className="ml-1 text-sm text-muted">万円</span>
            </p>
            <div className="mt-1">
              <Delta value={latest.profit - prev.profit} suffix="万円" />
            </div>
          </Card>
          <Card className="p-4">
            <p className="text-xs font-medium text-muted">健康度</p>
            <p className="tnum mt-1 text-2xl font-bold text-foreground">
              {latest.health}
              <span className="ml-1 text-sm text-muted">点</span>
            </p>
            <div className="mt-1">
              <Delta value={latest.health - prev.health} suffix="点" />
            </div>
          </Card>
          <Card className="flex flex-col items-start p-4">
            <p className="text-xs font-medium text-muted">ランク</p>
            <div className="mt-1.5">
              <RankChip rank={rankFromScore(latest.health)} />
            </div>
            <p className="mt-2 text-[11px] text-muted">
              {karte.length}か月前は {rankFromScore(karte[0].health)} ランク（{karte[0].health}点）
            </p>
          </Card>
        </div>
      </section>

      {/* 推移グラフ */}
      <KarteChart karte={karte} />

      {/* 月次履歴テーブル */}
      <section>
        <SectionTitle title="月次履歴" subtitle="毎月保存されたカルテの一覧" />
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-sm">
              <thead>
                <tr className="border-b border-border bg-surface-2 text-left text-xs text-muted">
                  <th className="px-4 py-3 font-medium">年月</th>
                  <th className="px-4 py-3 text-right font-medium">売上</th>
                  <th className="px-4 py-3 text-right font-medium">利益</th>
                  <th className="px-4 py-3 text-right font-medium">健康度</th>
                  <th className="px-4 py-3 text-center font-medium">ランク</th>
                  <th className="px-4 py-3 text-right font-medium">前月差（健康度）</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {rows.map((k, i) => {
                  const prevRow = rows[i + 1];
                  const diff = prevRow ? k.health - prevRow.health : 0;
                  const [y, m] = k.month.split("-");
                  return (
                    <tr key={k.month} className="transition-colors hover:bg-surface-2/60">
                      <td className="px-4 py-3 font-medium text-foreground">
                        {y}年{Number(m)}月
                      </td>
                      <td className="tnum px-4 py-3 text-right text-foreground">
                        {k.sales} 万円
                      </td>
                      <td className="tnum px-4 py-3 text-right text-foreground">
                        {k.profit} 万円
                      </td>
                      <td className="tnum px-4 py-3 text-right font-bold text-foreground">
                        {k.health} 点
                      </td>
                      <td className="px-4 py-3 text-center">
                        <RankChip rank={rankFromScore(k.health)} />
                      </td>
                      <td className="px-4 py-3 text-right">
                        {prevRow ? <Delta value={diff} suffix="点" /> : <span className="text-xs text-muted">—</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
        <p className="mt-3 text-xs text-muted">
          ※ 売上 {yen(karte[0].sales * 10000)} → {yen(latest.sales * 10000)}、健康度 {karte[0].health} → {latest.health}点。{karte.length}か月で着実に改善しています。
        </p>
      </section>
    </div>
  );
}

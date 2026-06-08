import { Plug, Plus, CheckCircle2, AlertTriangle, RefreshCw } from "lucide-react";
import { redirect } from "next/navigation";
import { PageHeader, Card, SectionTitle } from "@/components/ui";
import DataSources from "@/components/DataSources";
import { availableSources, syncHistory } from "@/lib/mock";
import { getDashboardData } from "@/lib/queries";

export const metadata = { title: "データ連携 — NY33 Company Dock" };

export default async function SourcesPage() {
  const data = await getDashboardData();
  if (!data) redirect("/onboarding");
  const connectedCount = data.dataSources.length;

  return (
    <div className="space-y-8">
      <PageHeader
        icon={<Plug className="h-5 w-5" />}
        title="データ連携"
        description="各サービスを接続すると、毎朝データが自動取得され、ダッシュボードと会社カルテに反映されます。"
        action={
          <button className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-primary/90">
            <RefreshCw className="h-4 w-4" />
            今すぐ同期
          </button>
        }
      />

      {/* 連携中 */}
      <section>
        <SectionTitle
          title="連携中のサービス"
          subtitle={`${connectedCount}件のデータソースが接続されています`}
        />
        <DataSources sources={data.dataSources} showHeader={false} />
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* 追加できる連携 */}
        <section>
          <SectionTitle title="追加できる連携" subtitle="接続するとさらに精度の高い分析が可能になります" />
          <div className="space-y-3">
            {availableSources.map((s) => (
              <Card key={s.id} className="flex items-center gap-4 p-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-surface-2 text-muted">
                  <Plug className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-foreground">{s.name}</p>
                  <p className="truncate text-xs text-muted">{s.desc}</p>
                </div>
                <button className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-primary/30 bg-primary-weak px-3 py-2 text-xs font-bold text-primary transition-colors hover:bg-primary hover:text-white">
                  <Plus className="h-3.5 w-3.5" />
                  接続
                </button>
              </Card>
            ))}
          </div>
        </section>

        {/* 同期履歴 */}
        <section>
          <SectionTitle title="同期履歴" subtitle="直近の自動取得ログ" />
          <Card className="divide-y divide-border">
            {syncHistory.map((e, i) => (
              <div key={i} className="flex items-start gap-3 p-4">
                {e.result === "success" ? (
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-good" />
                ) : (
                  <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-warn" />
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-bold text-foreground">{e.source}</p>
                    <p className="tnum shrink-0 text-[11px] text-muted">{e.time}</p>
                  </div>
                  <p className="text-xs text-muted">{e.note}</p>
                </div>
              </div>
            ))}
          </Card>
        </section>
      </div>
    </div>
  );
}

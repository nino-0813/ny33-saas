import { Plug, Plus, CheckCircle2, AlertTriangle, Zap } from "lucide-react";
import { redirect } from "next/navigation";
import { PageHeader, Card, SectionTitle } from "@/components/ui";
import DataSources from "@/components/DataSources";
import SyncButton from "@/components/SyncButton";
import SourceConnectForm from "@/components/SourceConnectForm";
import { availableSources, syncHistory } from "@/lib/mock";
import { getDashboardData } from "@/lib/queries";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "データ連携 — NY33 Company Dock" };

type Json = Record<string, unknown>;

export default async function SourcesPage() {
  const data = await getDashboardData();
  if (!data) redirect("/onboarding");
  const connectedCount = data.dataSources.length;

  // GA4 / GSC の設定値（プロパティID・サイトURL・前回エラー）をプリフィル用に取得
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: company } = await supabase
    .from("companies")
    .select("id, website_url")
    .eq("owner_id", user!.id)
    .maybeSingle();
  const { data: srcRows } = await supabase
    .from("data_sources")
    .select("source_key, config")
    .eq("company_id", company!.id);

  const configBy = new Map<string, Json>(
    (srcRows ?? []).map((r) => [r.source_key, (r.config as Json) ?? {}]),
  );
  const ga4Cfg = configBy.get("ga4") ?? {};
  const gscCfg = configBy.get("gsc") ?? {};
  const str = (v: unknown) => (v == null ? undefined : String(v));

  return (
    <div className="space-y-8">
      <PageHeader
        icon={<Plug className="h-5 w-5" />}
        title="データ連携"
        description="GA4・Search Console を接続すると、実際の数値を取得してダッシュボードに反映します。"
        action={<SyncButton />}
      />

      {/* Google 連携（実データ） */}
      <section>
        <SectionTitle
          title="Google 連携（実データ取得）"
          subtitle="サービスアカウントに閲覧権限を付与し、GA4 はプロパティID（数値）、Search Console はサイトURLを設定してください。"
          action={
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-600">
              <Zap className="h-3.5 w-3.5" />
              実データ
            </span>
          }
        />
        <div className="grid gap-3 lg:grid-cols-2">
          <SourceConnectForm
            sourceKey="ga4"
            title="Google Analytics 4"
            fieldName="propertyId"
            label="プロパティID（数値・例: 123456789）"
            placeholder="123456789"
            help="GA4 管理 → プロパティ設定 で確認。測定ID（G-XXXX）ではありません。"
            currentValue={str(ga4Cfg.propertyId)}
            lastError={str(ga4Cfg.lastError)}
          />
          <SourceConnectForm
            sourceKey="gsc"
            title="Search Console"
            fieldName="siteUrl"
            label="サイトURL（例: https://example.com/ または sc-domain:example.com）"
            placeholder={company?.website_url || "https://example.com/"}
            help="Search Console のプロパティと完全一致させてください（末尾スラッシュ含む）。"
            currentValue={str(gscCfg.siteUrl ?? gscCfg.value)}
            lastError={str(gscCfg.lastError)}
          />
        </div>
      </section>

      {/* 連携中 */}
      <section>
        <SectionTitle
          title="連携中のサービス"
          subtitle={`${connectedCount}件のデータソース・「今すぐ同期」で最新化`}
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

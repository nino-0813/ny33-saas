import {
  Plug,
  Plus,
  CheckCircle2,
  AlertTriangle,
  Zap,
  LogIn,
  Link2Off,
} from "lucide-react";
import { redirect } from "next/navigation";
import { PageHeader, Card, SectionTitle } from "@/components/ui";
import CompanyInfoForm from "@/components/CompanyInfoForm";
import DataSources from "@/components/DataSources";
import SyncButton from "@/components/SyncButton";
import GoogleSourceSelect, {
  type SelectOption,
} from "@/components/GoogleSourceSelect";
import { availableSources, syncHistory } from "@/lib/mock";
import { getDashboardData } from "@/lib/queries";
import { createClient } from "@/lib/supabase/server";
import {
  getConnection,
  getAccessTokenForCompany,
  hasOAuthConfig,
} from "@/lib/google/oauth";
import { listGa4Properties } from "@/lib/google/ga4";
import { listSearchConsoleSites } from "@/lib/google/searchConsole";
import { disconnectGoogleAction } from "@/lib/sync-actions";

export const metadata = { title: "データ連携 — NY33 Company Dock" };

type Json = Record<string, unknown>;

const STATUS_MSG: Record<string, { ok: boolean; text: string }> = {
  connected: { ok: true, text: "Google と連携しました。プロパティ／サイトを選んで同期してください。" },
  denied: { ok: false, text: "連携がキャンセルされました。" },
  invalid: { ok: false, text: "連携に失敗しました（不正なリクエスト）。" },
  error: { ok: false, text: "連携に失敗しました。時間をおいて再度お試しください。" },
  norefresh: { ok: false, text: "再連携が必要です。一度「連携解除」してからやり直してください。" },
  unconfigured: { ok: false, text: "Google 連携が未設定です（運営側の設定が必要です）。" },
};

export default async function SourcesPage({
  searchParams,
}: {
  searchParams: Promise<{ google?: string }>;
}) {
  const data = await getDashboardData();
  if (!data) redirect("/onboarding");
  const { google: googleStatus } = await searchParams;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: company } = await supabase
    .from("companies")
    .select("id, name, industry, area, website_url, description")
    .eq("owner_id", user!.id)
    .maybeSingle();
  const companyId = company!.id;

  const connection = await getConnection(companyId);

  // 設定値（選択済みプロパティ/サイト・前回エラー）
  const { data: srcRows } = await supabase
    .from("data_sources")
    .select("source_key, config")
    .eq("company_id", companyId);
  const cfgBy = new Map<string, Json>(
    (srcRows ?? []).map((r) => [r.source_key, (r.config as Json) ?? {}]),
  );
  const ga4Cfg = cfgBy.get("ga4") ?? {};
  const gscCfg = cfgBy.get("gsc") ?? {};
  const str = (v: unknown) => (v == null ? undefined : String(v));

  // 連携済みなら GA4 プロパティ / GSC サイト一覧を取得
  let ga4Options: SelectOption[] = [];
  let gscOptions: SelectOption[] = [];
  let listError = "";
  if (connection) {
    try {
      const token = await getAccessTokenForCompany(companyId);
      if (token) {
        const [props, sites] = await Promise.all([
          listGa4Properties(token).catch(() => []),
          listSearchConsoleSites(token).catch(() => []),
        ]);
        ga4Options = props.map((p) => ({ value: p.propertyId, label: p.label }));
        gscOptions = sites.map((s) => ({ value: s.siteUrl, label: s.siteUrl }));
      }
    } catch {
      listError = "一覧の取得に失敗しました。連携をやり直してください。";
    }
  }

  return (
    <div className="space-y-8">
      <PageHeader
        icon={<Plug className="h-5 w-5" />}
        title="データ連携"
        description="Google アカウントで連携すると、GA4・Search Console の実データをダッシュボードに反映します。"
        action={<SyncButton />}
      />

      {/* ステータス通知 */}
      {googleStatus && STATUS_MSG[googleStatus] && (
        <div
          className={`flex items-center gap-2 rounded-2xl px-4 py-3 text-sm ${
            STATUS_MSG[googleStatus].ok
              ? "bg-emerald-50 text-emerald-700"
              : "bg-orange-50 text-orange-700"
          }`}
        >
          {STATUS_MSG[googleStatus].ok ? (
            <CheckCircle2 className="h-5 w-5 shrink-0" />
          ) : (
            <AlertTriangle className="h-5 w-5 shrink-0" />
          )}
          {STATUS_MSG[googleStatus].text}
        </div>
      )}

      {/* 会社情報 */}
      <section>
        <CompanyInfoForm
          company={{
            name: company!.name,
            industry: company!.industry,
            area: company!.area,
            websiteUrl: company!.website_url,
            description: company!.description,
          }}
        />
      </section>

      {/* Google 連携 */}
      <section>
        <SectionTitle
          title="Google 連携（実データ取得）"
          subtitle="GA4・Search Console をあなたの Google アカウントで連携します。"
          action={
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-600">
              <Zap className="h-3.5 w-3.5" />
              実データ
            </span>
          }
        />

        {!connection ? (
          <Card className="flex flex-col items-start gap-3 p-5">
            <p className="text-sm text-foreground">
              「Google で連携」を押すと、Google のログイン画面が開きます。許可すると、
              <span className="font-semibold">自分のGA4プロパティ・サイトを一覧から選ぶ</span>
              だけで実データが取得できます。
            </p>
            <a
              href="/api/google/connect"
              className="inline-flex items-center gap-2 rounded-full bg-black px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-gray-800"
            >
              <LogIn className="h-4 w-4" />
              Google で連携
            </a>
            {!hasOAuthConfig() && (
              <p className="text-xs text-orange-600">
                ※ 現在 Google 連携は未設定です（運営側の OAuth 設定が必要）。
              </p>
            )}
          </Card>
        ) : (
          <div className="space-y-3">
            <Card className="flex items-center justify-between gap-3 p-4">
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                <span className="text-foreground">
                  連携済み:{" "}
                  <span className="font-semibold">{connection.email || "Google アカウント"}</span>
                </span>
              </div>
              <form action={disconnectGoogleAction}>
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-3 py-1.5 text-xs font-medium text-muted transition-colors hover:bg-surface-2 hover:text-foreground"
                >
                  <Link2Off className="h-3.5 w-3.5" />
                  連携解除
                </button>
              </form>
            </Card>

            {listError && (
              <p className="text-xs text-orange-600">{listError}</p>
            )}

            <div className="grid gap-3 lg:grid-cols-2">
              <GoogleSourceSelect
                sourceKey="ga4"
                title="Google Analytics 4（プロパティ）"
                options={ga4Options}
                currentValue={str(ga4Cfg.propertyId)}
                lastError={str(ga4Cfg.lastError)}
                emptyHint="アクセスできる GA4 プロパティが見つかりません。連携アカウントの権限をご確認ください。"
              />
              <GoogleSourceSelect
                sourceKey="gsc"
                title="Search Console（サイト）"
                options={gscOptions}
                currentValue={str(gscCfg.siteUrl)}
                lastError={str(gscCfg.lastError)}
                emptyHint="アクセスできるサイトが見つかりません。Search Console の登録をご確認ください。"
              />
            </div>
          </div>
        )}
      </section>

      {/* 連携中 */}
      <section>
        <SectionTitle
          title="連携中のサービス"
          subtitle="「今すぐ同期」で最新化されます"
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

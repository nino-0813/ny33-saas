import Link from "next/link";
import { redirect } from "next/navigation";
import {
  Activity,
  TrendingUp,
  AlertCircle,
  Plug,
  ArrowRight,
  Lightbulb,
} from "lucide-react";
import { PageHeader, Card } from "@/components/ui";
import { getTrafficBreakdown } from "@/lib/traffic-data";
import type { Ga4Channel } from "@/lib/google/ga4";
import type { CvAssist } from "@/lib/cv-assist";
import CvAssistCard from "@/components/traffic/CvAssistCard";

export const metadata = { title: "流入分析 — Webドック" };

export default async function TrafficPage() {
  const state = await getTrafficBreakdown();

  return (
    <div className="space-y-5">
      <PageHeader
        title="流入分析"
        description="どこからの訪問が成果（CV）につながりやすいかを比べ、増やすべきチャネルを見つけます。"
        icon={<Activity className="h-5 w-5" />}
      />

      {state.status === "not-connected" && (
        <EmptyState
          icon={<Plug className="h-6 w-6" />}
          title="まずGoogleアナリティクスと連携してください"
          desc="GA4を連携すると、流入元ごとのアクセスとCVを自動で分析します。"
          href="/sources"
          cta="設定・連携へ"
        />
      )}

      {state.status === "no-property" && (
        <EmptyState
          icon={<Plug className="h-6 w-6" />}
          title="GA4プロパティを選択してください"
          desc="連携は済んでいます。分析するGA4プロパティを選んで同期してください。"
          href="/sources"
          cta="プロパティを選ぶ"
        />
      )}

      {state.status === "error" && (
        <div className="flex items-start gap-3 rounded-xl bg-bad-weak px-4 py-3 text-sm text-bad">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
          <div>
            <p className="font-bold">データを取得できませんでした</p>
            <p className="mt-0.5">{state.message}</p>
          </div>
        </div>
      )}

      {state.status === "ok" && (
        <TrafficReport channels={state.channels} cvAssist={state.cvAssist} />
      )}
    </div>
  );
}

function TrafficReport({
  channels,
  cvAssist,
}: {
  channels: Ga4Channel[];
  cvAssist?: CvAssist;
}) {
  if (channels.length === 0) {
    return (
      <EmptyState
        icon={<Activity className="h-6 w-6" />}
        title="直近28日のデータがまだありません"
        desc="アクセスが蓄積されると、流入元別の分析が表示されます。"
        href="/sources"
        cta="同期する"
      />
    );
  }

  const totalSessions = channels.reduce((s, c) => s + c.sessions, 0);
  const totalConversions = channels.reduce((s, c) => s + c.conversions, 0);
  const maxSessions = Math.max(...channels.map((c) => c.sessions), 1);
  const hasCv = totalConversions > 0;

  // 施策のための抽出（ノイズ除去のためセッション5以上を対象）
  const meaningful = channels.filter((c) => c.sessions >= 5);
  const bestCvr = hasCv
    ? [...meaningful].sort((a, b) => b.cvr - a.cvr)[0]
    : undefined;
  const biggest = [...channels].sort((a, b) => b.sessions - a.sessions)[0];
  const underperformer =
    hasCv && bestCvr
      ? [...meaningful]
          .filter((c) => c.channel !== bestCvr.channel && c.sessions >= biggest.sessions * 0.3)
          .sort((a, b) => a.cvr - b.cvr)[0]
      : undefined;

  return (
    <>
      {/* サマリ */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Metric label="集計期間" value="直近28日" />
        <Metric label="総セッション" value={totalSessions.toLocaleString()} />
        <Metric label="流入元の数" value={`${channels.length}`} />
        <Metric
          label="総CV"
          value={hasCv ? totalConversions.toLocaleString() : "0"}
          tone={hasCv ? "good" : "default"}
        />
      </div>

      {/* 施策提案 */}
      <Card className="p-5">
        <div className="mb-3 flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-weak text-primary">
            <Lightbulb className="h-4 w-4" />
          </span>
          <h2 className="text-sm font-bold text-foreground">この数字から言えること</h2>
        </div>

        {hasCv ? (
          <ul className="space-y-2 text-sm leading-relaxed text-foreground">
            {bestCvr && (
              <li>
                ✅ <b>{bestCvr.channel}</b> が最も成果につながっています（CV率{" "}
                <b className="text-good">{bestCvr.cvr.toFixed(1)}%</b>）。
                ここへの投稿・広告・導線を<b>増やす</b>のが効果的です。
              </li>
            )}
            {underperformer && (
              <li>
                ⚠️ <b>{underperformer.channel}</b> は流入が多い割にCV率が低め（
                {underperformer.cvr.toFixed(1)}%）。
                着地ページや導線に改善の余地があります。
              </li>
            )}
          </ul>
        ) : (
          <div className="space-y-2 text-sm leading-relaxed text-foreground">
            <p>
              最も流入が多いのは <b>{biggest.channel}</b>（{biggest.sessions.toLocaleString()}
              セッション）です。ただし現在 <b>GA4にコンバージョン（キーイベント）が未設定</b>
              のため、「どの流入が成果につながるか」はまだ測れません。下の「CV設定アシスト」で設定すると、
              流入元ごとのCV率を自動で比較できるようになります。
            </p>
          </div>
        )}
        <Link
          href="/chat"
          className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline"
        >
          この結果をもとに施策を相談する <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </Card>

      {/* CV設定アシスト（CVが0のときだけ） */}
      {!hasCv && cvAssist && <CvAssistCard assist={cvAssist} />}

      {/* 流入元別テーブル */}
      <Card className="overflow-hidden">
        <div className="flex items-center gap-2 border-b border-border px-5 py-4">
          <TrendingUp className="h-4 w-4 text-primary" />
          <h2 className="text-sm font-bold text-foreground">流入元別の内訳（直近28日）</h2>
        </div>
        <div className="divide-y divide-border">
          {channels.map((c) => {
            const isBest = hasCv && bestCvr?.channel === c.channel;
            return (
              <div key={c.channel} className="px-5 py-3">
                <div className="mb-1.5 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-foreground">{c.channel}</span>
                    {isBest && (
                      <span className="rounded-full bg-good-weak px-2 py-0.5 text-[10px] font-bold text-good">
                        CV率トップ
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-xs text-muted">
                    <span>
                      <span className="tnum font-bold text-foreground">
                        {c.sessions.toLocaleString()}
                      </span>{" "}
                      セッション
                    </span>
                    {hasCv && (
                      <span>
                        CV{" "}
                        <span className="tnum font-bold text-foreground">{c.conversions}</span>
                      </span>
                    )}
                    <span className="w-16 text-right">
                      CV率{" "}
                      <span
                        className={`tnum font-bold ${isBest ? "text-good" : "text-foreground"}`}
                      >
                        {c.cvr.toFixed(1)}%
                      </span>
                    </span>
                  </div>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-surface-2">
                  <div
                    className={`h-full rounded-full ${isBest ? "bg-good" : "bg-primary"}`}
                    style={{ width: `${(c.sessions / maxSessions) * 100}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </>
  );
}

function Metric({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: string;
  tone?: "default" | "good";
}) {
  return (
    <Card className="p-4">
      <p className="text-xs font-medium text-muted">{label}</p>
      <p
        className={`tnum mt-1 truncate text-xl font-bold ${
          tone === "good" ? "text-good" : "text-foreground"
        }`}
      >
        {value}
      </p>
    </Card>
  );
}

function EmptyState({
  icon,
  title,
  desc,
  href,
  cta,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
  href: string;
  cta: string;
}) {
  return (
    <Card className="flex flex-col items-center justify-center gap-3 px-6 py-14 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-weak text-primary">
        {icon}
      </span>
      <div>
        <p className="text-sm font-bold text-foreground">{title}</p>
        <p className="mx-auto mt-1 max-w-md text-xs leading-relaxed text-muted">{desc}</p>
      </div>
      <Link
        href={href}
        className="inline-flex min-h-10 items-center gap-1.5 rounded-lg bg-primary px-4 text-sm font-bold text-white transition-colors hover:bg-primary/90"
      >
        {cta}
        <ArrowRight className="h-4 w-4" />
      </Link>
    </Card>
  );
}

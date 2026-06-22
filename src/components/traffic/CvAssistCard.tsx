import { Target, AlertTriangle, ArrowRight } from "lucide-react";
import { Card } from "@/components/ui";
import type { CvAssist } from "@/lib/cv-assist";

export default function CvAssistCard({ assist }: { assist: CvAssist }) {
  const { suggestions, missingPurchase } = assist;

  return (
    <Card className="overflow-hidden border-primary/30">
      <div className="flex items-center gap-2 border-b border-border bg-primary-weak/30 px-5 py-4">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-white">
          <Target className="h-4 w-4" />
        </span>
        <div>
          <h2 className="text-sm font-bold text-foreground">CV設定アシスト</h2>
          <p className="text-xs text-muted">
            成果（CV）を測れるようにすると、流入分析が「どこを増やすべきか」まで分かります
          </p>
        </div>
      </div>

      <div className="space-y-4 p-5">
        {missingPurchase && (
          <div className="flex items-start gap-2 rounded-xl bg-warn-weak px-3 py-2.5 text-xs leading-relaxed text-warn">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <p>
              カート追加・購入手続きのイベントはあるのに、<b>「購入完了(purchase)」イベントが見つかりません</b>。
              ECサイトとして最重要のCVが計測できていない可能性があります。購入計測の導入を最優先で検討してください。
            </p>
          </div>
        )}

        {suggestions.length > 0 ? (
          <div>
            <p className="mb-2 text-xs font-bold text-foreground">
              あなたのサイトで発生中の「CVにできるイベント」
            </p>
            <ul className="space-y-2">
              {suggestions.map((s) => (
                <li
                  key={s.event}
                  className="flex items-center gap-3 rounded-xl border border-border/70 bg-surface-2/40 p-3"
                >
                  <span
                    className={`shrink-0 rounded-md px-2 py-0.5 text-[11px] font-bold ${
                      s.tier === "primary"
                        ? "bg-good-weak text-good"
                        : "bg-primary-weak text-primary"
                    }`}
                  >
                    {s.tier === "primary" ? "最重要" : "有力"}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-foreground">{s.label}</p>
                    <p className="text-xs text-muted">
                      <code className="rounded bg-surface-2 px-1">{s.event}</code> ・直近28日で
                      {s.count.toLocaleString()}回
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <p className="text-sm text-muted">
            CVにできそうなイベントがまだ検出できていません。フォーム送信や購入などの計測（イベント送信）を
            サイトに設定するところから始めましょう。
          </p>
        )}

        {/* 設定手順 */}
        <div className="rounded-xl border border-border bg-surface-2/30 p-4">
          <p className="mb-2 text-xs font-bold text-foreground">
            GA4でキーイベントにする手順（5分）
          </p>
          <ol className="space-y-1.5 text-xs leading-relaxed text-foreground">
            <li>1. GA4を開く →「管理」（左下の歯車）</li>
            <li>2.「データの表示」→「<b>キーイベント</b>」を開く</li>
            <li>
              3. 上記のイベント名（例:{" "}
              <code className="rounded bg-surface-2 px-1">
                {suggestions[0]?.event ?? "begin_checkout"}
              </code>
              ）を「<b>新しいキーイベント</b>」に登録、または「イベント」一覧で対象を
              <b>「キーイベントとしてマーク」</b>
            </li>
            <li>4. 反映に最大24時間。その後この画面の「同期」でCV率が表示されます</li>
          </ol>
          {missingPurchase && (
            <p className="mt-2 text-[11px] leading-relaxed text-muted">
              ※ purchase（購入）はサイト側の計測実装が必要です。ご利用のECカート（Shopify / BASE /
              STORES / カラーミー等）のGA4連携設定をご確認ください。
            </p>
          )}
        </div>

        <a
          href="https://analytics.google.com/"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-10 items-center gap-1.5 rounded-lg bg-primary px-4 text-sm font-bold text-white transition-colors hover:bg-primary/90"
        >
          GA4を開いて設定する
          <ArrowRight className="h-4 w-4" />
        </a>
      </div>
    </Card>
  );
}

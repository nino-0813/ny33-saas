import { Sparkles, Check, Lock, ArrowRight, Bot } from "lucide-react";
import { PageHeader, Card } from "@/components/ui";
import { gptFeatures, gptExamples } from "@/lib/mock";

export const metadata = { title: "Company GPT — NY33 Company Dock" };

export default function GptPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        icon={<Sparkles className="h-5 w-5" />}
        title="Company GPT"
        description="あなたの会社のデータをすべて学習した、社長専用AI。「どうすれば儲かる？」に数字で即答します。"
        action={
          <span className="inline-flex items-center gap-1.5 rounded-full bg-accent px-3 py-1.5 text-sm font-bold text-white">
            <Lock className="h-3.5 w-3.5" />
            近日公開
          </span>
        }
      />

      {/* ヒーロー */}
      <div className="overflow-hidden rounded-2xl bg-navy p-6 sm:p-8">
        <div className="grid gap-8 lg:grid-cols-2 lg:items-center">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-bold text-white/90">
              <Sparkles className="h-3.5 w-3.5" />
              Phase 6 で提供予定
            </span>
            <h2 className="mt-4 text-2xl font-bold leading-snug text-white sm:text-3xl">
              会社のすべてを知る
              <br />
              あなただけの経営AI
            </h2>
            <ul className="mt-6 space-y-3">
              {gptFeatures.map((f) => (
                <li key={f} className="flex items-start gap-3 text-sm text-white/85">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-good/20 text-good">
                    <Check className="h-3.5 w-3.5" />
                  </span>
                  {f}
                </li>
              ))}
            </ul>
            <button className="mt-7 inline-flex items-center gap-2 rounded-lg bg-accent px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-accent/90">
              先行利用リストに登録
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>

          {/* プレビュー会話 */}
          <div className="rounded-xl bg-white/5 p-4 ring-1 ring-white/10">
            <div className="mb-3 flex items-center gap-2 text-xs font-medium text-white/70">
              <span className="flex h-6 w-6 items-center justify-center rounded-md bg-white/10">
                <Bot className="h-3.5 w-3.5 text-white" />
              </span>
              社長専用GPT・プレビュー
            </div>
            <div className="space-y-4">
              {gptExamples.map((ex) => (
                <div key={ex.q} className="space-y-2">
                  <div className="flex justify-end">
                    <p className="max-w-[80%] rounded-2xl rounded-tr-sm bg-primary px-3.5 py-2 text-sm text-white">
                      {ex.q}
                    </p>
                  </div>
                  <div className="rounded-2xl rounded-tl-sm bg-white/10 px-3.5 py-2.5 text-sm leading-relaxed text-white/90">
                    {ex.a}
                    <div className="mt-2 flex flex-wrap gap-2">
                      {ex.facts.map((f) => (
                        <span
                          key={f.label}
                          className="rounded-md bg-good/15 px-2 py-1 text-[11px] font-bold text-good"
                        >
                          {f.label} {f.value}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* データ資産戦略 */}
      <section>
        <h2 className="mb-1 text-base font-bold text-foreground">なぜ専用AIが作れるのか</h2>
        <p className="mb-4 text-sm text-muted">
          Company Dock に蓄積される会社データそのものが、将来のAIの価値になります。
        </p>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { when: "現在", what: "GPTの汎用知識", level: 1 },
            { when: "1年後", what: "自社の蓄積データ", level: 2 },
            { when: "3年後", what: "地域企業データベース", level: 3 },
            { when: "5年後", what: "利益向上AIモデル", level: 4 },
          ].map((s) => (
            <Card key={s.when} className="p-4">
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-md bg-navy text-xs font-bold text-white">
                  {s.level}
                </span>
                <p className="text-sm font-bold text-foreground">{s.when}</p>
              </div>
              <p className="mt-2 text-sm text-muted">{s.what}</p>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}

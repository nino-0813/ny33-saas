import { Bot, AlertTriangle, ArrowRight } from "lucide-react";
import { Card, PriorityStars } from "./ui";
import { yen, type AiIssue } from "@/lib/mock";

export default function AiAdvisor({
  issues,
  improvementYen,
}: {
  issues: AiIssue[];
  improvementYen: number;
}) {
  const totalLoss = issues.reduce((s, i) => s + i.lossYen, 0);

  return (
    <section aria-labelledby="ai-advisor-title">
      <div className="mb-3 flex items-end justify-between gap-3">
        <div>
          <h2 id="ai-advisor-title" className="text-base font-bold text-foreground">
            Company AI の今月の診断
          </h2>
          <p className="mt-0.5 text-xs text-muted">
            経営コンサル・マーケター・データアナリストの視点で分析
          </p>
        </div>
        <span className="hidden items-center gap-1.5 rounded-full bg-navy px-3 py-1.5 text-xs font-bold text-white sm:inline-flex">
          <Bot className="h-3.5 w-3.5" />
          GPT 分析
        </span>
      </div>

      {/* サマリー */}
      <Card className="mb-3 flex items-center gap-4 border-accent/30 bg-accent-weak/40 p-4">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-accent/15">
          <AlertTriangle className="h-5 w-5 text-accent" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-bold text-foreground">
            改善すれば月 <span className="text-accent">+{yen(improvementYen)}</span> の利益アップが見込めます
          </p>
          <p className="mt-0.5 text-xs text-muted">
            放置による推定損失は合計 {yen(totalLoss)} / 月。優先度の高い順に対応しましょう。
          </p>
        </div>
      </Card>

      {/* 課題リスト */}
      <div className="grid gap-3 lg:grid-cols-3">
        {issues.map((issue) => (
          <Card key={issue.rank} className="flex flex-col p-4">
            <div className="mb-2 flex items-center justify-between">
              <span className="flex h-6 w-6 items-center justify-center rounded-md bg-navy text-xs font-bold text-white">
                {issue.rank}
              </span>
              <PriorityStars value={issue.priority} />
            </div>
            <h3 className="text-sm font-bold text-foreground">{issue.title}</h3>
            <p className="mt-1 flex-1 text-xs leading-relaxed text-muted">
              {issue.detail}
            </p>
            <div className="mt-3 rounded-lg bg-surface-2 px-3 py-2">
              <p className="text-[11px] font-medium text-muted">推定損失</p>
              <p className="tnum text-sm font-bold text-bad">
                -{yen(issue.lossYen)} / 月
              </p>
            </div>
            <button className="mt-3 inline-flex items-center justify-between gap-2 rounded-lg border border-primary/20 bg-primary-weak px-3 py-2 text-left text-xs font-bold text-primary transition-colors hover:bg-primary hover:text-white">
              <span>{issue.action}</span>
              <ArrowRight className="h-4 w-4 shrink-0" />
            </button>
          </Card>
        ))}
      </div>
    </section>
  );
}

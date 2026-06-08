"use client";

import { useState } from "react";
import { Bot, Send, Sparkles } from "lucide-react";
import { Card } from "./ui";
import {
  aiConversation,
  aiSuggestedQuestions,
  type ChatMessage,
} from "@/lib/mock";

const toneClass: Record<string, string> = {
  good: "text-good bg-good-weak",
  bad: "text-bad bg-bad-weak",
  primary: "text-primary bg-primary-weak",
};

function Bubble({ msg }: { msg: ChatMessage }) {
  if (msg.role === "user") {
    return (
      <div className="flex justify-end">
        <div className="max-w-[85%] rounded-2xl rounded-tr-sm bg-primary px-4 py-2.5 text-sm text-white">
          {msg.text}
        </div>
      </div>
    );
  }
  return (
    <div className="flex gap-3">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-navy text-white">
        <Bot className="h-4 w-4" />
      </div>
      <div className="max-w-[85%] space-y-2">
        <div className="rounded-2xl rounded-tl-sm bg-surface-2 px-4 py-2.5 text-sm leading-relaxed text-foreground">
          {msg.text}
        </div>
        {msg.facts && (
          <div className="flex flex-wrap gap-2">
            {msg.facts.map((f) => (
              <div
                key={f.label}
                className={`rounded-lg px-3 py-1.5 ${toneClass[f.tone ?? "primary"]}`}
              >
                <p className="text-[11px] font-medium opacity-80">{f.label}</p>
                <p className="tnum text-sm font-bold">{f.value}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function CompanyAiChat() {
  const [messages] = useState<ChatMessage[]>(aiConversation);
  const [draft, setDraft] = useState("");

  return (
    <Card className="flex h-full flex-col overflow-hidden">
      <div className="flex items-center gap-2 border-b border-border px-4 py-3">
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-navy text-white">
          <Sparkles className="h-4 w-4" />
        </span>
        <p className="text-sm font-bold text-foreground">Company AI に相談</p>
        <span className="ml-auto rounded-full bg-good-weak px-2 py-0.5 text-[11px] font-bold text-good">
          オンライン
        </span>
      </div>

      {/* 会話 */}
      <div className="flex-1 space-y-4 overflow-y-auto px-4 py-5">
        {messages.map((m, i) => (
          <Bubble key={i} msg={m} />
        ))}
      </div>

      {/* サジェスト */}
      <div className="flex flex-wrap gap-2 border-t border-border px-4 pt-3">
        {aiSuggestedQuestions.map((q) => (
          <button
            key={q}
            onClick={() => setDraft(q)}
            className="rounded-full border border-border bg-surface px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:border-primary hover:bg-primary-weak hover:text-primary"
          >
            {q}
          </button>
        ))}
      </div>

      {/* 入力（プロトタイプ） */}
      <form
        className="flex items-center gap-2 px-4 py-3"
        onSubmit={(e) => e.preventDefault()}
      >
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="経営の悩みを入力（例：今月利益を上げる方法は？）"
          className="min-h-11 flex-1 rounded-lg border border-border bg-surface px-3 text-sm text-foreground outline-none placeholder:text-muted focus:border-primary focus:ring-2 focus:ring-primary/20"
          aria-label="質問を入力"
        />
        <button
          type="submit"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary text-white transition-colors hover:bg-primary/90"
          aria-label="送信"
        >
          <Send className="h-4 w-4" />
        </button>
      </form>
      <p className="px-4 pb-3 text-[11px] text-muted">
        ※ Phase 1 はUIプロトタイプです。実際のAI応答は Phase 3（GPT連携）で有効になります。
      </p>
    </Card>
  );
}

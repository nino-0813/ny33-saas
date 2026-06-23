"use client";

import { useEffect, useRef, useState } from "react";
import { BarChart3, Loader2, Send, Sparkles } from "lucide-react";
import type { FunnelChatFocus } from "@/lib/funnel-insights";

type Role = "user" | "assistant";
interface Message {
  role: Role;
  content: string;
}

const SUGGESTIONS = [
  "今いちばん優先してやるべき集客施策は？",
  "検索順位を上げるために今週やることを3つ教えて",
  "問い合わせを増やすには何を改善すべき？",
  "今月の目標を一緒に立てたい",
];

export default function ChatPanel({ focus }: { focus?: FunnelChatFocus }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [pending, setPending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages, pending]);

  async function send(text: string) {
    const content = text.trim();
    if (!content || pending) return;

    const next: Message[] = [...messages, { role: "user", content }];
    setMessages(next);
    setInput("");
    setPending(true);
    // アシスタントの空メッセージを置いてストリームで埋める
    setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next, topic: focus?.key }),
      });
      if (!res.ok || !res.body) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "応答を取得できませんでした。");
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let acc = "";
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        acc += decoder.decode(value, { stream: true });
        setMessages((prev) => {
          const copy = [...prev];
          copy[copy.length - 1] = { role: "assistant", content: acc };
          return copy;
        });
      }
    } catch (error) {
      setMessages((prev) => {
        const copy = [...prev];
        copy[copy.length - 1] = {
          role: "assistant",
          content:
            error instanceof Error
              ? `エラー: ${error.message}`
              : "エラーが発生しました。",
        };
        return copy;
      });
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex h-[calc(100dvh-220px)] min-h-[420px] flex-col rounded-2xl border border-border bg-surface">
      <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto p-5">
        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-weak text-primary">
              <Sparkles className="h-6 w-6" />
            </span>
            {focus ? (
              <>
                <div className="mb-4 w-full max-w-lg rounded-2xl border border-primary/25 bg-primary-weak/45 p-4 text-left">
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-primary shadow-sm">
                      <BarChart3 className="h-5 w-5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-primary">
                        {focus.name}の評価を引き継ぎました
                      </p>
                      <p className="mt-0.5 text-sm font-bold text-foreground">
                        {focus.actual}
                        <span className="ml-2 text-xs text-muted">
                          目安：{focus.target}
                        </span>
                      </p>
                    </div>
                    <span className="tnum text-2xl font-bold text-primary">
                      {focus.score}
                    </span>
                  </div>
                  <p className="mt-3 text-xs leading-5 text-muted">
                    {focus.interpretation}
                  </p>
                </div>
                <p className="text-sm font-bold text-foreground">
                  知りたいことを選んでください
                </p>
                <p className="mt-1 text-xs text-muted">
                  このサイトの実データを踏まえて回答します。
                </p>
              </>
            ) : (
              <>
                <p className="text-sm font-bold text-foreground">
                  Web集客のことなら何でも聞いてください
                </p>
                <p className="mt-1 text-xs text-muted">
                  あなたのサイトのデータを踏まえて、今日やることを提案します。
                </p>
              </>
            )}
            <div className="mt-5 grid w-full max-w-lg gap-2 sm:grid-cols-2">
              {(focus?.questions ?? SUGGESTIONS).map((s, index) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => send(s)}
                  className="group flex min-h-16 items-start gap-2.5 rounded-xl border border-border bg-surface px-3 py-3 text-left text-xs leading-5 text-foreground transition-colors hover:border-primary/50 hover:bg-primary-weak/35"
                >
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary-weak text-[10px] font-bold text-primary transition-colors group-hover:bg-primary group-hover:text-white">
                    {index + 1}
                  </span>
                  <span>{s}</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((m, i) => (
            <div
              key={i}
              className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                  m.role === "user"
                    ? "bg-primary text-white"
                    : "bg-surface-2 text-foreground"
                }`}
              >
                {m.content || (
                  <Loader2 className="h-4 w-4 animate-spin text-muted" />
                )}
              </div>
            </div>
          ))
        )}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
        className="flex items-end gap-2 border-t border-border p-3"
      >
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              send(input);
            }
          }}
          rows={1}
          placeholder="メッセージを入力（Enterで送信 / Shift+Enterで改行）"
          className="max-h-32 min-h-11 flex-1 resize-none rounded-xl border border-border bg-surface px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
        />
        <button
          type="submit"
          disabled={pending || !input.trim()}
          className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary text-white transition-colors hover:bg-primary/90 disabled:opacity-40"
          aria-label="送信"
        >
          {pending ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <Send className="h-5 w-5" />
          )}
        </button>
      </form>
    </div>
  );
}

"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Sparkles, ArrowUpRight, Loader2 } from "lucide-react";

const PROMPT =
  "今日のWeb集客で最優先でやるべき一手を、提供データを踏まえて1つだけ提案してください。" +
  "60字以内、敬体。前置き・挨拶・箇条書き・記号は不要で、本文だけを書いてください。";

export default function DailyFocus() {
  const [text, setText] = useState("");
  const [done, setDone] = useState(false);
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    (async () => {
      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: [{ role: "user", content: PROMPT }] }),
        });
        if (!res.ok || !res.body) throw new Error();
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let acc = "";
        for (;;) {
          const { done: d, value } = await reader.read();
          if (d) break;
          acc += decoder.decode(value, { stream: true });
          setText(acc);
        }
      } catch {
        setText("今日も一歩ずつ。まずは集客チャットで現状を聞いてみましょう。");
      } finally {
        setDone(true);
      }
    })();
  }, []);

  return (
    <section className="relative overflow-hidden rounded-3xl border border-[#b9dce8] bg-surface p-5 shadow-[0_2px_8px_rgba(15,31,51,0.05),0_16px_36px_-20px_rgba(31,105,132,0.24)] sm:p-6">
      <div
        aria-hidden
        className="pointer-events-none absolute -right-20 -top-24 h-56 w-56 rounded-full bg-[#dff3f8] blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-[#9dd3e3]/20 via-[#5aa8c2] to-[#9dd3e3]/20"
      />

      <div className="relative">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#e7f5f9] text-[#347f9b] ring-1 ring-[#add7e5]">
              <Sparkles className="h-[18px] w-[18px]" strokeWidth={1.8} />
            </span>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#4b96b1]">
                Daily Focus
              </p>
              <h2 className="text-sm font-bold text-foreground">今日の一手</h2>
            </div>
          </div>
          <span className="rounded-full bg-[#e5f5fa] px-2.5 py-1 text-[10px] font-bold tracking-wide text-[#347f9b] ring-1 ring-[#b9dce8]">
            AI提案
          </span>
        </div>

        <div className="min-h-[4.5rem]">
          {text ? (
            <p className="max-w-3xl text-base font-bold leading-[1.85] text-foreground sm:text-lg">
              {text}
              {!done && <span className="ml-0.5 animate-pulse text-[#4b96b1]">▍</span>}
            </p>
          ) : (
            <div className="flex min-h-[4.5rem] items-center gap-3 text-sm font-medium text-muted">
              <Loader2 className="h-5 w-5 animate-spin text-[#4b96b1]" />
              今日のデータから、優先アクションを考えています
            </div>
          )}
        </div>

        <div className="mt-5 flex items-center justify-between gap-4 border-t border-border/80 pt-4">
          <p className="hidden text-xs text-muted sm:block">
            集客チャットで具体的な進め方を確認できます
          </p>
          <Link
            href="/chat"
            className="group ml-auto inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#4b96b1] px-4 py-2.5 text-sm font-bold text-white shadow-[0_7px_18px_-9px_rgba(31,105,132,0.75)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#347f9b] hover:shadow-[0_11px_24px_-10px_rgba(31,105,132,0.8)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#75bdd3] focus-visible:ring-offset-2"
          >
            この提案を相談する
            <ArrowUpRight
              className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
              strokeWidth={2}
            />
          </Link>
        </div>
      </div>
    </section>
  );
}

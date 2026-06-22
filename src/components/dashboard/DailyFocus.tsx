"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Sparkles, ArrowRight, Loader2 } from "lucide-react";

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
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary to-emerald-600 p-5 text-white shadow-sm sm:p-6">
      <div className="mb-2 flex items-center gap-2">
        <Sparkles className="h-4 w-4" />
        <span className="text-xs font-bold tracking-wide opacity-90">今日の一手</span>
      </div>
      <p className="min-h-[3.5rem] text-lg font-bold leading-relaxed sm:text-xl">
        {text || <Loader2 className="h-5 w-5 animate-spin opacity-80" />}
        {text && !done && <span className="ml-0.5 animate-pulse">▍</span>}
      </p>
      <Link
        href="/chat"
        className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-white/15 px-3 py-2 text-sm font-bold backdrop-blur transition-colors hover:bg-white/25"
      >
        この件を相談する
        <ArrowRight className="h-4 w-4" />
      </Link>
    </div>
  );
}

"use client";

import { useState } from "react";
import {
  ArrowRight,
  ExternalLink,
  Loader2,
  Search,
  Sparkles,
} from "lucide-react";
import type {
  JourneyPlan,
  JourneyProductInput,
} from "@/lib/customer-journey";

const EMPTY: JourneyProductInput = {
  productName: "",
  description: "",
  targetCustomer: "",
  price: "",
  url: "",
};

export default function JourneyStudio() {
  const [input, setInput] = useState(EMPTY);
  const [plan, setPlan] = useState<JourneyPlan | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  function update(key: keyof JourneyProductInput, value: string) {
    setInput((current) => ({ ...current, [key]: value }));
  }

  async function generate() {
    if (!input.productName.trim() || !input.description.trim() || pending) return;
    setPending(true);
    setError("");
    try {
      const response = await fetch("/api/journey", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "生成に失敗しました。");
      setPlan(data as JourneyPlan);
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "生成中にエラーが発生しました。",
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="space-y-5">
      <section className="grid gap-5 rounded-3xl border border-[#b9dce8] bg-surface p-5 shadow-sm lg:grid-cols-[0.9fr_1.1fr] lg:p-7">
        <div>
          <p className="text-xs font-bold tracking-[0.16em] text-primary">
            CUSTOMER JOURNEY
          </p>
          <h2 className="mt-2 text-2xl font-bold text-foreground">
            商品から集客の流れを設計
          </h2>
          <p className="mt-2 text-sm leading-7 text-muted">
            商品情報を入力すると、AIが市場や顧客の悩みを調査し、認知からファン化までの設計表を作ります。
          </p>

          <div className="mt-6 rounded-2xl bg-primary-weak/50 p-4 ring-1 ring-primary/15">
            <div className="flex items-center gap-2 text-sm font-bold text-primary">
              <Search className="h-4 w-4" />
              AIが整理する内容
            </div>
            <ul className="mt-3 space-y-2 text-xs leading-5 text-muted">
              <li>・顧客が各段階で行うこと</li>
              <li>・期待、不安、疑問などの心理</li>
              <li>・購入や継続を妨げるハードル</li>
              <li>・売り手が実行すべき具体的な施策</li>
            </ul>
          </div>
        </div>

        <div className="grid gap-4">
          <Field
            label="商品・サービス名"
            required
            value={input.productName}
            onChange={(value) => update("productName", value)}
            placeholder="例：中小企業向けWeb集客コンサルティング"
          />
          <TextArea
            label="商品の説明"
            required
            value={input.description}
            onChange={(value) => update("description", value)}
            placeholder="何を提供し、どんな悩みをどう解決する商品かを書いてください"
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="想定している顧客"
              value={input.targetCustomer}
              onChange={(value) => update("targetCustomer", value)}
              placeholder="例：地方の小規模事業者"
            />
            <Field
              label="価格・料金"
              value={input.price}
              onChange={(value) => update("price", value)}
              placeholder="例：月額5万円"
            />
          </div>
          <Field
            label="商品ページURL"
            value={input.url}
            onChange={(value) => update("url", value)}
            placeholder="https://example.com/service"
            type="url"
          />

          {error && (
            <p role="alert" className="rounded-xl bg-bad-weak px-4 py-3 text-sm text-bad">
              {error}
            </p>
          )}

          <button
            type="button"
            onClick={generate}
            disabled={
              pending || !input.productName.trim() || !input.description.trim()
            }
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-bold text-white shadow-[0_8px_20px_-10px_rgba(31,105,132,0.8)] transition-all hover:-translate-y-0.5 hover:bg-[#347f9b] disabled:cursor-not-allowed disabled:opacity-45"
          >
            {pending ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                AIが調査して設計中…
              </>
            ) : (
              <>
                <Sparkles className="h-5 w-5" />
                集客設計を作る
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </div>
      </section>

      {plan ? <JourneyResult plan={plan} /> : <EmptyResult />}
    </div>
  );
}

function JourneyResult({ plan }: { plan: JourneyPlan }) {
  return (
    <div className="space-y-5">
      <section className="grid gap-3 sm:grid-cols-3">
        <Summary label="商品の要約" value={plan.productSummary} />
        <Summary label="中心となる顧客" value={plan.targetCustomer} />
        <Summary label="選ばれるための軸" value={plan.positioning} />
      </section>

      <section className="overflow-hidden rounded-3xl border border-border bg-surface shadow-sm">
        <div className="border-b border-border px-5 py-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-foreground">7段階の集客設計</h2>
              <p className="mt-1 text-xs text-muted">
                顧客の視点と、売り手が行う施策を横並びで確認できます。
              </p>
            </div>
            <span className="rounded-full bg-primary-weak px-3 py-1 text-xs font-bold text-primary">
              {plan.researched ? "Webリサーチ済み" : "AI仮説"}
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <div className="min-w-[980px]">
            <div className="grid grid-cols-[100px_repeat(4,minmax(0,1fr))] border-b border-border bg-primary-weak/35 text-xs font-bold text-foreground">
              <div className="p-4">段階</div>
              <div className="border-l border-border p-4">顧客の物語</div>
              <div className="border-l border-border p-4">カラダの動き</div>
              <div className="border-l border-border p-4">ココロの動き</div>
              <div className="border-l border-border p-4">ハードルと施策</div>
            </div>
            {plan.stages.map((stage) => (
              <div
                key={stage.key}
                className="grid grid-cols-[100px_repeat(4,minmax(0,1fr))] border-b border-border last:border-b-0"
              >
                <div className="flex items-center justify-center bg-[#f7fbfc] p-4 text-sm font-bold text-[#286d87]">
                  {stage.name}
                </div>
                <Cell>
                  <p className="font-bold text-foreground">{stage.story}</p>
                </Cell>
                <ListCell items={stage.actions} />
                <ListCell items={stage.thoughts} />
                <Cell>
                  <div className="space-y-3">
                    <div>
                      <p className="text-[10px] font-bold tracking-wide text-bad">
                        顧客のハードル
                      </p>
                      <ul className="mt-1 space-y-1">
                        {stage.hurdles.map((item) => (
                          <li key={item}>{item}</li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold tracking-wide text-primary">
                        実行する施策
                      </p>
                      <ul className="mt-1 space-y-1 font-medium text-foreground">
                        {stage.measures.map((item) => (
                          <li key={item}>→ {item}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </Cell>
              </div>
            ))}
          </div>
        </div>
      </section>

      {plan.sources.length > 0 && (
        <section className="rounded-3xl border border-border bg-surface p-5 shadow-sm">
          <h2 className="text-sm font-bold text-foreground">リサーチに使用した情報</h2>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {plan.sources.map((source) => (
              <a
                key={source.url}
                href={source.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex min-h-12 items-center justify-between gap-3 rounded-xl border border-border px-3 py-2 text-xs font-medium text-foreground transition-colors hover:border-primary/50 hover:bg-primary-weak/30"
              >
                <span className="line-clamp-2">{source.title}</span>
                <ExternalLink className="h-4 w-4 shrink-0 text-primary" />
              </a>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function EmptyResult() {
  return (
    <div className="flex min-h-72 flex-col items-center justify-center rounded-3xl border border-dashed border-primary/30 bg-surface/65 px-6 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-weak text-primary">
        <Sparkles className="h-6 w-6" />
      </span>
      <p className="mt-4 text-sm font-bold text-foreground">
        商品情報を入力すると、ここに集客設計が表示されます
      </p>
      <p className="mt-1 max-w-lg text-xs leading-6 text-muted">
        最初から完璧に書く必要はありません。分かる範囲で入力すれば、AIが仮説を補いながら整理します。
      </p>
    </div>
  );
}

function Summary({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-4 shadow-sm">
      <p className="text-xs font-bold text-primary">{label}</p>
      <p className="mt-2 text-sm font-bold leading-6 text-foreground">{value}</p>
    </div>
  );
}

function Cell({ children }: { children: React.ReactNode }) {
  return (
    <div className="border-l border-border p-4 text-xs leading-6 text-muted">
      {children}
    </div>
  );
}

function ListCell({ items }: { items: string[] }) {
  return (
    <Cell>
      <ul className="space-y-1.5">
        {items.map((item) => (
          <li key={item}>・{item}</li>
        ))}
      </ul>
    </Cell>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  required = false,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  required?: boolean;
  type?: string;
}) {
  return (
    <label className="grid gap-1.5 text-xs font-bold text-foreground">
      <span>
        {label}
        {required && <span className="ml-1 text-bad">*</span>}
      </span>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="h-11 rounded-xl border border-border bg-surface px-3 text-sm font-normal outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
      />
    </label>
  );
}

function TextArea({
  label,
  value,
  onChange,
  placeholder,
  required = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  required?: boolean;
}) {
  return (
    <label className="grid gap-1.5 text-xs font-bold text-foreground">
      <span>
        {label}
        {required && <span className="ml-1 text-bad">*</span>}
      </span>
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        rows={4}
        className="resize-y rounded-xl border border-border bg-surface px-3 py-2.5 text-sm font-normal leading-6 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
      />
    </label>
  );
}


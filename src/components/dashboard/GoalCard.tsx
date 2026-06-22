"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Target,
  Check,
  Plus,
  Sparkles,
  Loader2,
  Trophy,
  X,
  RotateCcw,
} from "lucide-react";
import {
  createGoal,
  toggleGoalStep,
  setGoalStatus,
  type GoalStep,
} from "@/lib/goal-actions";
import type { Goal } from "@/lib/goals-data";

export default function GoalCard({ goal }: { goal: Goal | null }) {
  if (!goal) return <GoalCreate />;
  return <GoalView goal={goal} />;
}

/* ============================ 目標の表示・実行 ============================ */

function GoalView({ goal }: { goal: Goal }) {
  const router = useRouter();
  const [steps, setSteps] = useState<GoalStep[]>(goal.steps);
  const [, startTransition] = useTransition();

  const doneCount = steps.filter((s) => s.done).length;
  const pct = steps.length ? Math.round((doneCount / steps.length) * 100) : 0;
  const achieved = goal.status === "done";

  function toggle(stepId: string) {
    setSteps((prev) =>
      prev.map((s) => (s.id === stepId ? { ...s, done: !s.done } : s)),
    );
    startTransition(async () => {
      await toggleGoalStep(goal.id, stepId);
      router.refresh();
    });
  }

  return (
    <div className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
      <div className="mb-3 flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-weak text-primary">
            {achieved ? <Trophy className="h-4 w-4" /> : <Target className="h-4 w-4" />}
          </span>
          <div>
            <h2 className="text-base font-bold text-foreground">
              {achieved ? "達成した目標" : "今の目標"}
            </h2>
            {goal.targetLabel && (
              <p className="text-xs font-medium text-primary">{goal.targetLabel}</p>
            )}
          </div>
        </div>
        <button
          type="button"
          onClick={() =>
            startTransition(async () => {
              await setGoalStatus(goal.id, "archived");
              router.refresh();
            })
          }
          className="rounded-lg p-1.5 text-muted transition-colors hover:bg-surface-2 hover:text-foreground"
          aria-label="この目標を終了して新しく立てる"
          title="新しい目標を立てる"
        >
          <RotateCcw className="h-4 w-4" />
        </button>
      </div>

      <p className="text-sm font-bold text-foreground">{goal.title}</p>
      {goal.detail && <p className="mt-1 text-xs text-muted">{goal.detail}</p>}

      {/* 進捗バー */}
      <div className="mt-3">
        <div className="mb-1 flex items-center justify-between text-xs">
          <span className="font-medium text-muted">達成度</span>
          <span className="font-bold text-foreground">
            {doneCount}/{steps.length}（{pct}%）
          </span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-surface-2">
          <div
            className="h-full rounded-full bg-primary transition-all duration-300"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {/* ステップ */}
      <ul className="mt-4 space-y-2">
        {steps.map((s) => (
          <li key={s.id}>
            <button
              type="button"
              onClick={() => toggle(s.id)}
              className="flex w-full items-center gap-3 rounded-xl border border-border/70 p-2.5 text-left transition-colors hover:bg-surface-2/50"
            >
              <span
                className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border ${
                  s.done
                    ? "border-primary bg-primary text-white"
                    : "border-border bg-surface"
                }`}
              >
                {s.done && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
              </span>
              <span
                className={`text-sm ${
                  s.done ? "text-muted line-through" : "text-foreground"
                }`}
              >
                {s.text}
              </span>
            </button>
          </li>
        ))}
      </ul>

      {achieved && (
        <p className="mt-4 rounded-xl bg-good-weak px-3 py-2 text-center text-sm font-bold text-good">
          🎉 目標達成おめでとうございます！次の目標を立てましょう
        </p>
      )}
    </div>
  );
}

/* ============================ 目標の作成 ============================ */

function GoalCreate() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [target, setTarget] = useState("");
  const [stepsText, setStepsText] = useState("");
  const [suggesting, setSuggesting] = useState(false);
  const [saving, startSave] = useTransition();
  const [error, setError] = useState("");

  async function suggest() {
    setSuggesting(true);
    setError("");
    try {
      const res = await fetch("/api/goals/suggest", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "生成に失敗しました。");
      setTitle(data.title ?? "");
      setTarget(data.target_label ?? "");
      setStepsText((data.steps ?? []).join("\n"));
      setOpen(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "生成に失敗しました。");
    } finally {
      setSuggesting(false);
    }
  }

  function save() {
    setError("");
    startSave(async () => {
      const result = await createGoal({
        title,
        target_label: target,
        steps: stepsText.split("\n"),
      });
      if (!result.ok) {
        setError(result.error ?? "保存に失敗しました。");
        return;
      }
      router.refresh();
    });
  }

  if (!open) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-primary/30 bg-primary-weak/20 p-6 text-center">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-weak text-primary">
          <Target className="h-5 w-5" />
        </span>
        <div>
          <p className="text-sm font-bold text-foreground">今月の目標を立てましょう</p>
          <p className="mt-0.5 text-xs text-muted">
            目標とステップを決めて、毎日チェックしながら進めます。
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-2">
          <button
            type="button"
            onClick={suggest}
            disabled={suggesting}
            className="inline-flex min-h-10 items-center gap-1.5 rounded-lg bg-primary px-3.5 text-sm font-bold text-white transition-colors hover:bg-primary/90 disabled:opacity-60"
          >
            {suggesting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
            AIに目標を提案してもらう
          </button>
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="inline-flex min-h-10 items-center gap-1.5 rounded-lg border border-border px-3.5 text-sm font-medium text-foreground transition-colors hover:bg-surface-2"
          >
            <Plus className="h-4 w-4" />
            自分で立てる
          </button>
        </div>
        {error && <p className="text-xs text-bad">{error}</p>}
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-base font-bold text-foreground">目標を立てる</h2>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="rounded-lg p-1.5 text-muted hover:bg-surface-2"
          aria-label="閉じる"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="space-y-3">
        <label className="block">
          <span className="mb-1 block text-xs font-bold text-foreground">目標</span>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="例: 問い合わせを増やす"
            className="h-11 w-full rounded-lg border border-border bg-surface px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-bold text-foreground">数値目標（任意）</span>
          <input
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            placeholder="例: 問い合わせ20件/月"
            className="h-11 w-full rounded-lg border border-border bg-surface px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-bold text-foreground">
            ステップ（1行に1つ）
          </span>
          <textarea
            value={stepsText}
            onChange={(e) => setStepsText(e.target.value)}
            rows={4}
            placeholder={"Googleビジネスの投稿を週2回\nよくある質問ページを作る\n口コミを5件集める"}
            className="w-full resize-y rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </label>
        {error && <p className="text-xs text-bad">{error}</p>}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={save}
            disabled={saving || !title.trim()}
            className="inline-flex min-h-11 flex-1 items-center justify-center gap-1.5 rounded-lg bg-primary px-4 text-sm font-bold text-white transition-colors hover:bg-primary/90 disabled:opacity-50"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
            この目標で始める
          </button>
          <button
            type="button"
            onClick={suggest}
            disabled={suggesting}
            className="inline-flex min-h-11 items-center gap-1.5 rounded-lg border border-border px-3 text-sm font-medium text-foreground transition-colors hover:bg-surface-2 disabled:opacity-60"
          >
            {suggesting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
            AI提案
          </button>
        </div>
      </div>
    </div>
  );
}

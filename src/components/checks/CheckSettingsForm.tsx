"use client";

import { useActionState } from "react";
import { Loader2, CheckCircle2, AlertTriangle, Save } from "lucide-react";
import { saveCheckSettings, type CheckSettingsState } from "@/lib/check-actions";

export interface CheckSettingsValues {
  enabled: boolean;
  targetScore: number;
  alertThreshold: number;
  frequency: string;
}

const FREQ_OPTIONS = [
  { value: "daily", label: "毎日" },
  { value: "weekly", label: "毎週" },
  { value: "monthly", label: "毎月" },
];

export default function CheckSettingsForm({
  checkKey,
  initial,
}: {
  checkKey: string;
  initial: CheckSettingsValues;
}) {
  const [state, action, pending] = useActionState<CheckSettingsState, FormData>(
    saveCheckSettings,
    {},
  );

  return (
    <div className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
      <h2 className="mb-4 text-base font-bold text-foreground">設定</h2>

      <form action={action} className="space-y-5">
        <input type="hidden" name="check_key" value={checkKey} />

        {/* 有効/無効 */}
        <label className="flex items-center justify-between gap-3">
          <span>
            <span className="block text-sm font-medium text-foreground">このチェックを有効にする</span>
            <span className="block text-xs text-muted">無効にすると診断・通知を停止します</span>
          </span>
          <input
            type="checkbox"
            name="enabled"
            defaultChecked={initial.enabled}
            className="peer sr-only"
          />
          <span className="relative h-6 w-11 shrink-0 rounded-full bg-surface-2 transition-colors peer-checked:bg-good after:absolute after:left-0.5 after:top-0.5 after:h-5 after:w-5 after:rounded-full after:bg-white after:shadow after:transition-transform peer-checked:after:translate-x-5" />
        </label>

        {/* 目標スコア */}
        <div>
          <label htmlFor={`${checkKey}-target`} className="mb-1.5 block text-sm font-medium text-foreground">
            目標スコア
          </label>
          <div className="flex items-center gap-2">
            <input
              id={`${checkKey}-target`}
              name="target_score"
              type="number"
              min={0}
              max={100}
              defaultValue={initial.targetScore}
              className="h-10 w-24 rounded-lg border border-border bg-surface px-3 text-sm text-foreground outline-none focus:border-good focus:ring-2 focus:ring-good/20"
            />
            <span className="text-sm text-muted">/ 100 点</span>
          </div>
        </div>

        {/* 通知しきい値 */}
        <div>
          <label htmlFor={`${checkKey}-alert`} className="mb-1.5 block text-sm font-medium text-foreground">
            通知しきい値
          </label>
          <div className="flex items-center gap-2">
            <input
              id={`${checkKey}-alert`}
              name="alert_threshold"
              type="number"
              min={0}
              max={100}
              defaultValue={initial.alertThreshold}
              className="h-10 w-24 rounded-lg border border-border bg-surface px-3 text-sm text-foreground outline-none focus:border-good focus:ring-2 focus:ring-good/20"
            />
            <span className="text-sm text-muted">点を下回ったら通知</span>
          </div>
        </div>

        {/* チェック頻度 */}
        <div>
          <label htmlFor={`${checkKey}-freq`} className="mb-1.5 block text-sm font-medium text-foreground">
            チェック頻度
          </label>
          <select
            id={`${checkKey}-freq`}
            name="frequency"
            defaultValue={initial.frequency}
            className="h-10 w-full rounded-lg border border-border bg-surface px-3 text-sm text-foreground outline-none focus:border-good focus:ring-2 focus:ring-good/20"
          >
            {FREQ_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>

        <button
          type="submit"
          disabled={pending}
          className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-good px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-good/90 disabled:opacity-60"
        >
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          設定を保存
        </button>

        {state.error && (
          <p className="flex items-center gap-1.5 text-xs text-bad">
            <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
            {state.error}
          </p>
        )}
        {state.ok && (
          <p className="flex items-center gap-1.5 text-xs text-good">
            <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
            {state.message}
          </p>
        )}
      </form>
    </div>
  );
}

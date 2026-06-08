"use client";

import { useActionState } from "react";
import { Loader2, CheckCircle2, AlertTriangle, Save } from "lucide-react";
import { selectAndSyncAction, type SyncState } from "@/lib/sync-actions";

export interface SelectOption {
  value: string;
  label: string;
}

export default function GoogleSourceSelect({
  sourceKey,
  title,
  options,
  currentValue,
  lastError,
  emptyHint,
}: {
  sourceKey: "ga4" | "gsc";
  title: string;
  options: SelectOption[];
  currentValue?: string;
  lastError?: string;
  emptyHint: string;
}) {
  const [state, action, pending] = useActionState<SyncState, FormData>(
    selectAndSyncAction,
    {},
  );
  const outcome = state.outcomes?.[0];

  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/[0.04]">
      <p className="mb-3 text-sm font-bold text-black">{title}</p>

      {options.length === 0 ? (
        <p className="text-xs text-gray-500">{emptyHint}</p>
      ) : (
        <form action={action} className="flex gap-2">
          <input type="hidden" name="sourceKey" value={sourceKey} />
          <select
            name="value"
            defaultValue={currentValue ?? ""}
            className="h-10 min-w-0 flex-1 rounded-lg border border-gray-200 bg-white px-3 text-sm text-black outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
          >
            <option value="" disabled>
              選択してください
            </option>
            {options.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          <button
            type="submit"
            disabled={pending}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-emerald-500 px-3.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-600 disabled:opacity-60"
          >
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            保存して同期
          </button>
        </form>
      )}

      {state.error && (
        <p className="mt-2 flex items-center gap-1.5 text-xs text-orange-600">
          <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
          {state.error}
        </p>
      )}
      {outcome && (
        <p
          className={`mt-2 flex items-center gap-1.5 text-xs ${
            outcome.ok ? "text-emerald-600" : "text-orange-600"
          }`}
        >
          {outcome.ok ? (
            <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
          ) : (
            <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
          )}
          {outcome.message}
        </p>
      )}
      {!outcome && !state.error && lastError && (
        <p className="mt-2 flex items-center gap-1.5 text-xs text-orange-600">
          <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
          前回エラー: {lastError}
        </p>
      )}
    </div>
  );
}

"use client";

import { useActionState } from "react";
import { RefreshCw, Loader2, CheckCircle2, AlertTriangle } from "lucide-react";
import { runCheckAction, type MeasureState } from "@/lib/measure-actions";

export default function RecheckButton({
  checkKey,
  measurable,
}: {
  checkKey: string;
  measurable: boolean;
}) {
  const [state, action, pending] = useActionState<MeasureState, FormData>(
    runCheckAction,
    {},
  );

  if (!measurable) {
    return (
      <button
        type="button"
        disabled
        title="このチェックの自動計測は順次対応予定です"
        className="inline-flex shrink-0 items-center gap-2 self-start rounded-full bg-surface-2 px-4 py-2.5 text-sm font-semibold text-muted"
      >
        <RefreshCw className="h-4 w-4" />
        再チェック
      </button>
    );
  }

  return (
    <div className="flex flex-col items-start gap-1.5 sm:items-end">
      <form action={action}>
        <input type="hidden" name="check_key" value={checkKey} />
        <button
          type="submit"
          disabled={pending}
          className="inline-flex shrink-0 items-center gap-2 rounded-full bg-navy px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-navy/90 disabled:opacity-60"
        >
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          {pending ? "計測中…" : "再チェック"}
        </button>
      </form>
      {state.error && (
        <p className="flex items-center gap-1 text-right text-xs text-bad">
          <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
          {state.error}
        </p>
      )}
      {state.ok && (
        <p className="flex items-center gap-1 text-xs text-good">
          <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
          {state.message}
        </p>
      )}
    </div>
  );
}

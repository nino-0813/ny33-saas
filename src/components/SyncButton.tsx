"use client";

import { useActionState } from "react";
import { RefreshCw, Loader2, CheckCircle2, AlertTriangle } from "lucide-react";
import { syncAllAction, type SyncState } from "@/lib/sync-actions";

export default function SyncButton() {
  const [state, action, pending] = useActionState<SyncState, FormData>(
    syncAllAction,
    {},
  );

  return (
    <div className="flex flex-col items-start gap-2 sm:items-end">
      <form action={action}>
        <button
          type="submit"
          disabled={pending}
          className="inline-flex items-center gap-2 rounded-full bg-black px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-gray-800 disabled:opacity-60"
        >
          {pending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
          {pending ? "同期中…" : "今すぐ同期"}
        </button>
      </form>

      {state.error && (
        <p className="max-w-md text-right text-xs text-orange-600">{state.error}</p>
      )}

      {state.outcomes && state.outcomes.length > 0 && (
        <ul className="flex flex-col gap-1">
          {state.outcomes.map((o) => (
            <li
              key={o.sourceKey}
              className={`flex items-center gap-1.5 text-xs ${
                o.ok ? "text-primary" : "text-orange-600"
              }`}
            >
              {o.ok ? (
                <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
              ) : (
                <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
              )}
              <span className="font-medium">{o.name}</span>
              <span className="text-gray-500">— {o.message}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

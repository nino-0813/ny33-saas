"use client";

import { useActionState } from "react";
import { Sparkles, Loader2, AlertTriangle } from "lucide-react";
import { generateDiagnosisAction, type AiState } from "@/lib/ai-actions";

export default function AiDiagnoseButton({
  checkKey,
  hasDiagnosis,
}: {
  checkKey: string;
  hasDiagnosis: boolean;
}) {
  const [state, action, pending] = useActionState<AiState, FormData>(
    generateDiagnosisAction,
    {},
  );

  return (
    <div className="flex flex-col items-start gap-1.5">
      <form action={action}>
        <input type="hidden" name="check_key" value={checkKey} />
        <button
          type="submit"
          disabled={pending}
          className="inline-flex items-center gap-2 rounded-full bg-navy px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-navy/90 disabled:opacity-60"
        >
          {pending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Sparkles className="h-4 w-4" />
          )}
          {pending
            ? "AIが診断中…"
            : hasDiagnosis
              ? "AI診断を再生成"
              : "AIで診断する"}
        </button>
      </form>
      {state.error && (
        <p className="flex items-center gap-1 text-xs text-bad">
          <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
          {state.error}
        </p>
      )}
    </div>
  );
}

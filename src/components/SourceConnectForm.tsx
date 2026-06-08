"use client";

import { useActionState } from "react";
import { Loader2, CheckCircle2, AlertTriangle, Save } from "lucide-react";
import { saveAndSyncAction, type SyncState } from "@/lib/sync-actions";

export default function SourceConnectForm({
  sourceKey,
  title,
  fieldName,
  label,
  placeholder,
  help,
  currentValue,
  lastError,
}: {
  sourceKey: "ga4" | "gsc";
  title: string;
  fieldName: "propertyId" | "siteUrl";
  label: string;
  placeholder: string;
  help: string;
  currentValue?: string;
  lastError?: string;
}) {
  const [state, action, pending] = useActionState<SyncState, FormData>(
    saveAndSyncAction,
    {},
  );
  const outcome = state.outcomes?.[0];

  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/[0.04]">
      <p className="mb-3 text-sm font-bold text-black">{title}</p>

      <form action={action} className="space-y-2.5">
        <input type="hidden" name="sourceKey" value={sourceKey} />
        <label className="block text-xs font-medium text-gray-600">{label}</label>
        <div className="flex gap-2">
          <input
            name={fieldName}
            defaultValue={currentValue}
            placeholder={placeholder}
            className="h-10 flex-1 rounded-lg border border-gray-200 bg-white px-3 text-sm text-black outline-none placeholder:text-gray-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
          />
          <button
            type="submit"
            disabled={pending}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-emerald-500 px-3.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-600 disabled:opacity-60"
          >
            {pending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            保存して同期
          </button>
        </div>
        <p className="text-[11px] text-gray-500">💡 {help}</p>
      </form>

      {/* 結果 / エラー */}
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
          前回の同期エラー: {lastError}
        </p>
      )}
    </div>
  );
}

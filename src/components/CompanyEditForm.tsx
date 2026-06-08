"use client";

import { useActionState } from "react";
import { Loader2, CheckCircle2, AlertTriangle, Save, Globe } from "lucide-react";
import { updateCompany, type CompanyState } from "@/lib/company-actions";

const INDUSTRIES = [
  "不動産会社",
  "建設会社",
  "工務店",
  "美容室",
  "ホテル",
  "飲食店",
  "製造業",
  "その他",
];

export interface CompanyValues {
  name: string;
  industry: string;
  area: string;
  employees: number;
  websiteUrl: string;
  plan: string;
}

const inputCls =
  "h-11 w-full rounded-lg border border-border bg-surface px-3 text-sm text-foreground outline-none placeholder:text-muted focus:border-good focus:ring-2 focus:ring-good/20";

export default function CompanyEditForm({ initial }: { initial: CompanyValues }) {
  const [state, action, pending] = useActionState<CompanyState, FormData>(
    updateCompany,
    {},
  );

  return (
    <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
      <h2 className="mb-1 text-base font-bold text-foreground">会社プロフィール</h2>
      <p className="mb-5 text-xs text-muted">ダッシュボードや診断に使用される基本情報です。</p>

      <form action={action} className="space-y-4">
        <Field label="会社名" required>
          <input name="name" required defaultValue={initial.name} className={inputCls} />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="業種">
            <select name="industry" defaultValue={initial.industry || ""} className={inputCls}>
              <option value="">未設定</option>
              {INDUSTRIES.map((x) => (
                <option key={x} value={x}>
                  {x}
                </option>
              ))}
            </select>
          </Field>
          <Field label="従業員数">
            <input
              name="employees"
              type="number"
              min={0}
              inputMode="numeric"
              defaultValue={initial.employees || ""}
              className={inputCls}
            />
          </Field>
        </div>

        <Field label="エリア（市区町村）">
          <input name="area" defaultValue={initial.area} placeholder="例: 広島県尾道市" className={inputCls} />
        </Field>

        <Field label="会社サイトのURL">
          <div className="relative">
            <Globe className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <input
              name="website_url"
              type="url"
              defaultValue={initial.websiteUrl}
              placeholder="https://example.com"
              className={`${inputCls} pl-10`}
            />
          </div>
        </Field>

        {/* プラン（表示のみ） */}
        <div>
          <span className="mb-1.5 block text-sm font-medium text-foreground">契約プラン</span>
          <div className="flex h-11 items-center rounded-lg bg-surface-2 px-3 text-sm text-muted">
            {initial.plan}プラン（変更はサポートまで）
          </div>
        </div>

        <div className="flex items-center gap-3 pt-1">
          <button
            type="submit"
            disabled={pending}
            className="inline-flex items-center gap-2 rounded-lg bg-good px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-good/90 disabled:opacity-60"
          >
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            保存する
          </button>
          {state.error && (
            <span className="flex items-center gap-1.5 text-xs text-bad">
              <AlertTriangle className="h-3.5 w-3.5" />
              {state.error}
            </span>
          )}
          {state.ok && (
            <span className="flex items-center gap-1.5 text-xs text-good">
              <CheckCircle2 className="h-3.5 w-3.5" />
              {state.message}
            </span>
          )}
        </div>
      </form>
    </div>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-foreground">
        {label}
        {required && <span className="ml-1 text-bad">*</span>}
      </label>
      {children}
    </div>
  );
}

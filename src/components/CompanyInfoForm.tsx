"use client";

import { useActionState } from "react";
import { Building2, Loader2, Check, AlertCircle } from "lucide-react";
import { updateCompany, type CompanyState } from "@/lib/company-actions";

export interface CompanyInfo {
  name: string;
  industry: string;
  area: string;
  websiteUrl: string;
  description: string;
}

export default function CompanyInfoForm({ company }: { company: CompanyInfo }) {
  const [state, action, pending] = useActionState<CompanyState, FormData>(
    updateCompany,
    {},
  );

  return (
    <form action={action} className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
      <div className="mb-4 flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-weak text-primary">
          <Building2 className="h-5 w-5" />
        </span>
        <div>
          <h2 className="text-sm font-bold text-foreground">会社情報</h2>
          <p className="text-xs text-muted">
            AIはこの情報をもとに、あなたのビジネスに合った提案をします
          </p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="会社・店舗名" required>
          <input
            name="name"
            defaultValue={company.name}
            required
            className={inputCls}
            placeholder="例: イケベジ"
          />
        </Field>
        <Field label="業種">
          <input
            name="industry"
            defaultValue={company.industry}
            className={inputCls}
            placeholder="例: 農産物・野菜のEC"
          />
        </Field>
        <Field label="エリア・拠点">
          <input
            name="area"
            defaultValue={company.area}
            className={inputCls}
            placeholder="例: 広島県尾道市 / 全国（オンライン）"
          />
        </Field>
        <Field label="サイトURL">
          <input
            name="website_url"
            defaultValue={company.websiteUrl}
            className={inputCls}
            placeholder="https://www.example.com/"
          />
        </Field>
        <div className="sm:col-span-2">
          <Field label="どんなお店か（一言）">
            <textarea
              name="description"
              defaultValue={company.description}
              rows={3}
              className={`${inputCls} h-auto resize-y py-2`}
              placeholder="例: 無農薬野菜の定期便と、規格外野菜のお得セットをオンライン販売。リピーター中心。"
            />
            <p className="mt-1 text-xs text-muted">
              強み・客層・主力商品などを書くと、チャットや施策提案がより具体的になります。
            </p>
          </Field>
        </div>
      </div>

      <div className="mt-4 flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-bold text-white transition-colors hover:bg-primary/90 disabled:opacity-60"
        >
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
          保存する
        </button>
        {state.ok && state.message && (
          <span className="inline-flex items-center gap-1.5 text-sm font-medium text-good">
            <Check className="h-4 w-4" />
            {state.message}
          </span>
        )}
        {state.error && (
          <span className="inline-flex items-center gap-1.5 text-sm font-medium text-bad">
            <AlertCircle className="h-4 w-4" />
            {state.error}
          </span>
        )}
      </div>
    </form>
  );
}

const inputCls =
  "h-11 w-full rounded-lg border border-border bg-surface px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20";

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
    <label className="block">
      <span className="mb-1.5 block text-xs font-bold text-foreground">
        {label}
        {required && <span className="ml-0.5 text-bad">*</span>}
      </span>
      {children}
    </label>
  );
}

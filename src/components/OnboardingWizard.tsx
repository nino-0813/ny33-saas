"use client";

import { useActionState, useState } from "react";
import {
  Anchor,
  Building2,
  Plug,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Loader2,
  AlertCircle,
  BarChart3,
  Search,
  MapPin,
  Camera,
  MessageCircle,
  Globe,
} from "lucide-react";
import { completeOnboarding, type OnboardingResult } from "@/lib/onboarding";

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

interface SourceField {
  field: string;
  name: string;
  icon: typeof BarChart3;
  desc: string;
  placeholder: string;
  help: string;
}

const SOURCE_FIELDS: SourceField[] = [
  {
    field: "site_url",
    name: "Search Console（検索順位）",
    icon: Search,
    desc: "Google検索での順位・表示回数・クリック率を取得します。",
    placeholder: "会社サイトのURL（上のステップで入力済みなら自動）",
    help: "サイトの所有権確認が必要です。後ほど担当がサポートします。",
  },
  {
    field: "ga4_id",
    name: "Google Analytics 4（アクセス解析）",
    icon: BarChart3,
    desc: "サイトのPV・訪問者数・コンバージョンを取得します。",
    placeholder: "プロパティID（数値・例: 123456789）",
    help: "GA4 管理 > プロパティ設定 で確認。測定ID（G-XXXX）ではありません。後から設定もできます。",
  },
  {
    field: "gbp",
    name: "Google ビジネス（MEO・口コミ）",
    icon: MapPin,
    desc: "口コミ件数・閲覧数・地図表示などを取得します。",
    placeholder: "ビジネスプロフィールのURL または 店舗名",
    help: "Googleマップに表示されるお店の情報です。",
  },
  {
    field: "instagram",
    name: "Instagram",
    icon: Camera,
    desc: "フォロワー数・投稿数・エンゲージメントを取得します。",
    placeholder: "ユーザー名（例: @your_shop）",
    help: "プロアカウント（ビジネス/クリエイター）が必要です。",
  },
  {
    field: "line",
    name: "LINE 公式アカウント",
    icon: MessageCircle,
    desc: "友だち登録者数・ブロック率・配信実績を取得します。",
    placeholder: "LINE公式アカウントのID（例: @abc1234）",
    help: "LINE Official Account Manager で確認できます。",
  },
];

const STEPS = ["会社情報", "データ連携", "完了"];

export default function OnboardingWizard() {
  const [step, setStep] = useState(0);
  const [state, formAction, pending] = useActionState<OnboardingResult, FormData>(
    completeOnboarding,
    {},
  );

  return (
    <div className="mx-auto w-full max-w-2xl">
      {/* ヘッダー */}
      <div className="mb-8 flex flex-col items-center text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary">
          <Anchor className="h-6 w-6 text-white" strokeWidth={2} />
        </div>
        <h1 className="mt-4 text-xl font-bold text-foreground">
          NY33 Company Dock へようこそ
        </h1>
        <p className="mt-1 text-sm text-muted">
          まずは初期設定をしましょう。あとから変更・追加もできます。
        </p>
      </div>

      {/* ステッパー */}
      <div className="mb-8 flex items-center justify-center gap-2">
        {STEPS.map((label, i) => (
          <div key={label} className="flex items-center gap-2">
            <div className="flex items-center gap-2">
              <span
                className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition-colors ${
                  i < step
                    ? "bg-good text-white"
                    : i === step
                      ? "bg-primary text-white"
                      : "bg-surface-2 text-muted"
                }`}
              >
                {i < step ? <CheckCircle2 className="h-4 w-4" /> : i + 1}
              </span>
              <span
                className={`hidden text-sm font-medium sm:block ${
                  i === step ? "text-foreground" : "text-muted"
                }`}
              >
                {label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className="h-px w-6 bg-border sm:w-10" />
            )}
          </div>
        ))}
      </div>

      <form action={formAction}>
        {/* ステップ1: 会社情報。全フィールドは常にDOMに保持（hidden切替） */}
        <div className={step === 0 ? "block" : "hidden"}>
          <Section
            icon={<Building2 className="h-5 w-5" />}
            title="会社の基本情報"
            desc="ダッシュボードや会社カルテに表示されます。"
          >
            <Field label="会社名" required>
              <input
                name="name"
                required
                placeholder="例: 尾道マリン工務店"
                className={inputCls}
              />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="業種">
                <select name="industry" className={inputCls} defaultValue="">
                  <option value="" disabled>
                    選択してください
                  </option>
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
                  placeholder="例: 28"
                  className={inputCls}
                />
              </Field>
            </div>
            <Field label="エリア（市区町村）">
              <input
                name="area"
                placeholder="例: 広島県尾道市"
                className={inputCls}
              />
            </Field>
            <Field label="会社サイトのURL">
              <div className="relative">
                <Globe className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
                <input
                  name="website_url"
                  type="url"
                  placeholder="https://example.com"
                  className={`${inputCls} pl-10`}
                />
              </div>
            </Field>
          </Section>
        </div>

        {/* ステップ2: データ連携 */}
        <div className={step === 1 ? "block" : "hidden"}>
          <Section
            icon={<Plug className="h-5 w-5" />}
            title="データ連携の設定"
            desc="わかる範囲で入力してください。空欄のままスキップしてもOK。後から「データ連携」画面で設定・サポートを受けられます。"
          >
            <div className="space-y-3">
              {SOURCE_FIELDS.map((s) => {
                const Icon = s.icon;
                return (
                  <div
                    key={s.field}
                    className="rounded-xl border border-border bg-surface p-4"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary-weak text-primary">
                        <Icon className="h-[18px] w-[18px]" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold text-foreground">
                          {s.name}
                        </p>
                        <p className="mt-0.5 text-xs text-muted">{s.desc}</p>
                        <input
                          name={s.field}
                          placeholder={s.placeholder}
                          className={`${inputCls} mt-2.5`}
                        />
                        <p className="mt-1.5 text-[11px] text-muted">
                          💡 {s.help}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </Section>
        </div>

        {/* ステップ3: 完了 */}
        <div className={step === 2 ? "block" : "hidden"}>
          <Section
            icon={<CheckCircle2 className="h-5 w-5" />}
            title="準備ができました"
            desc="設定内容を保存してダッシュボードを開きます。"
          >
            <div className="rounded-xl border border-border bg-surface-2 p-5 text-sm text-foreground">
              <p className="font-bold">これから出来ること</p>
              <ul className="mt-3 space-y-2 text-muted">
                <li className="flex gap-2">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-good" />
                  会社健康度をスコアで把握し、改善余地を確認できます
                </li>
                <li className="flex gap-2">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-good" />
                  Company AI が今月の課題と打ち手を提案します
                </li>
                <li className="flex gap-2">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-good" />
                  連携が完了すると、実際の数値に自動で切り替わります
                </li>
              </ul>
              <p className="mt-4 rounded-lg bg-accent-weak px-3 py-2 text-xs text-accent">
                ※ 連携が完了するまでは、操作感を確認できるサンプルデータを表示します。
              </p>
            </div>
          </Section>
        </div>

        {state.error && (
          <div
            role="alert"
            className="mt-4 flex items-start gap-2 rounded-lg bg-bad-weak px-3 py-2.5 text-sm text-bad"
          >
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{state.error}</span>
          </div>
        )}

        {/* ナビゲーション */}
        <div className="mt-6 flex items-center justify-between gap-3">
          {step > 0 ? (
            <button
              type="button"
              onClick={() => setStep((s) => s - 1)}
              className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-surface-2"
            >
              <ArrowLeft className="h-4 w-4" />
              戻る
            </button>
          ) : (
            <span />
          )}

          {step < STEPS.length - 1 ? (
            <div className="flex items-center gap-2">
              {step === 1 && (
                <button
                  type="button"
                  onClick={() => setStep((s) => s + 1)}
                  className="rounded-lg px-4 py-2.5 text-sm font-medium text-muted transition-colors hover:text-foreground"
                >
                  スキップ
                </button>
              )}
              <button
                type="button"
                onClick={() => setStep((s) => s + 1)}
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-primary/90"
              >
                次へ
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <button
              type="submit"
              disabled={pending}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-primary/90 disabled:opacity-60"
            >
              {pending && <Loader2 className="h-4 w-4 animate-spin" />}
              ダッシュボードを開く
              <ArrowRight className="h-4 w-4" />
            </button>
          )}
        </div>
      </form>
    </div>
  );
}

const inputCls =
  "h-11 w-full rounded-lg border border-border bg-surface px-3 text-sm text-foreground outline-none placeholder:text-muted focus:border-primary focus:ring-2 focus:ring-primary/20";

function Section({
  icon,
  title,
  desc,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-6 shadow-[0_1px_2px_rgba(15,31,51,0.04)]">
      <div className="mb-5 flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary-weak text-primary">
          {icon}
        </div>
        <div>
          <h2 className="text-base font-bold text-foreground">{title}</h2>
          <p className="mt-0.5 text-sm text-muted">{desc}</p>
        </div>
      </div>
      <div className="space-y-4">{children}</div>
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

"use client";

import { usePathname } from "next/navigation";
import { RefreshCw, Bell, ChevronDown } from "lucide-react";

const TITLES: Record<string, { title: string; subtitle: string }> = {
  "/": { title: "ダッシュボード", subtitle: "毎日のWeb健康状態をチェックしましょう" },
  "/checks": { title: "チェック結果", subtitle: "各チェックの詳細を確認できます" },
  "/reports": { title: "レポート", subtitle: "月次レポートを確認できます" },
  "/tasks": { title: "改善タスク", subtitle: "推奨アクションの一覧" },
  "/sources": { title: "設定・連携", subtitle: "データ連携と各種設定" },
  "/consulting": {
    title: "業務・ROI診断",
    subtitle: "売上の流れを分解し、AIを入れるべき場所と投資効果を見つけます",
  },
  "/company": { title: "会社情報", subtitle: "会社プロフィールの確認・編集" },
  "/news": { title: "お知らせ", subtitle: "最新のお知らせ" },
  "/support": { title: "サポート", subtitle: "お問い合わせ・ヘルプ" },
};

export default function Header({
  userLabel,
  lastChecked,
}: {
  userLabel: string;
  lastChecked: string;
}) {
  const pathname = usePathname();
  const key = pathname === "/" ? "/" : `/${pathname.split("/")[1]}`;
  const meta = TITLES[key] ?? TITLES["/"];
  const initial = (userLabel || "U").trim().charAt(0).toUpperCase();

  return (
    <header className="flex flex-col gap-3 px-5 py-5 lg:flex-row lg:items-center lg:justify-between lg:px-8">
      <div className="pl-12 lg:pl-0">
        <h1 className="text-2xl font-bold text-foreground">{meta.title}</h1>
        <p className="mt-0.5 text-sm text-muted">{meta.subtitle}</p>
      </div>

      <div className="flex items-center gap-3 sm:gap-5">
        <div className="hidden items-center gap-2 text-xs text-muted sm:flex">
          <span>最終チェック：{lastChecked}</span>
          <button
            className="flex h-7 w-7 items-center justify-center rounded-full text-muted transition-colors hover:bg-surface-2"
            aria-label="再チェック"
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </button>
        </div>

        <button
          className="relative flex h-9 w-9 items-center justify-center rounded-full text-muted transition-colors hover:bg-surface-2"
          aria-label="お知らせ"
        >
          <Bell className="h-5 w-5" />
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
            3
          </span>
        </button>

        <button className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-navy text-sm font-bold text-white">
            {initial}
          </span>
          <span className="hidden max-w-[140px] truncate text-sm font-medium text-foreground sm:block">
            {userLabel}
          </span>
          <ChevronDown className="hidden h-4 w-4 text-muted sm:block" />
        </button>
      </div>
    </header>
  );
}

"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  MessageSquareText,
  Activity,
  Settings,
  ChartNoAxesCombined,
  Workflow,
  Anchor,
  Menu,
  X,
  ChevronDown,
  LogOut,
} from "lucide-react";
import { signOut } from "@/lib/auth-actions";

const nav = [
  { href: "/", label: "ホーム", icon: LayoutDashboard },
  { href: "/chat", label: "集客チャット", icon: MessageSquareText },
  { href: "/traffic", label: "流入分析", icon: Activity },
  { href: "/forecast", label: "需要予測", icon: ChartNoAxesCombined },
  { href: "/consulting", label: "業務・ROI診断", icon: Workflow },
  { href: "/sources", label: "設定・連携", icon: Settings },
];

function NavItems({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <nav className="flex flex-col gap-1" aria-label="メインナビゲーション">
      {nav.map((item) => {
        const Icon = item.icon;
        const active =
          item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={`group flex items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-medium transition-colors duration-150 ${
              active
                ? "bg-green-500 text-white shadow-sm"
                : "text-white/65 hover:bg-white/10 hover:text-white"
            }`}
          >
            <Icon className="h-5 w-5 shrink-0" strokeWidth={2} />
            <span className="flex-1">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

function Brand() {
  return (
    <div className="flex items-center gap-2.5 px-1">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-500">
        <Anchor className="h-6 w-6 text-white" strokeWidth={2.2} />
      </div>
      <div>
        <p className="text-lg font-bold leading-tight text-white">Webドック</p>
        <p className="text-[11px] leading-tight text-white/55">あなたのWeb健康診断</p>
      </div>
    </div>
  );
}

function CompanyCard({
  name,
  plan,
}: {
  name: string;
  plan: string;
}) {
  return (
    <div className="mt-auto">
      <div className="rounded-xl bg-white/[0.06] p-3.5 ring-1 ring-white/10">
        <button className="flex w-full items-center justify-between gap-2 text-left">
          <span className="truncate text-sm font-bold text-white">{name}</span>
          <ChevronDown className="h-4 w-4 shrink-0 text-white/50" />
        </button>
        <div className="mt-2 space-y-0.5 text-[11px] text-white/55">
          <p>契約プラン：{plan}プラン</p>
          <p>契約期間：2026/12/31まで</p>
        </div>
      </div>
      <form action={signOut} className="mt-2">
        <button
          type="submit"
          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-white/50 transition-colors hover:bg-white/10 hover:text-white"
        >
          <LogOut className="h-4 w-4" />
          ログアウト
        </button>
      </form>
    </div>
  );
}

export default function Sidebar({
  email,
  companyName,
  plan,
}: {
  email?: string;
  companyName: string;
  plan: string;
}) {
  const [open, setOpen] = useState(false);
  void email;

  return (
    <>
      {/* モバイル: 開閉ボタン */}
      <button
        onClick={() => setOpen(true)}
        className="fixed left-4 top-4 z-30 flex h-11 w-11 items-center justify-center rounded-xl bg-navy text-white shadow-md lg:hidden"
        aria-label="メニューを開く"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* デスクトップ: 固定サイドバー */}
      <aside className="hidden w-64 shrink-0 flex-col gap-7 bg-navy px-4 py-6 lg:flex">
        <Brand />
        <NavItems />
        <CompanyCard name={companyName} plan={plan} />
      </aside>

      {/* モバイル: ドロワー */}
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setOpen(false)}
            aria-hidden
          />
          <aside className="absolute left-0 top-0 flex h-full w-72 flex-col gap-7 bg-navy px-4 py-6">
            <div className="flex items-center justify-between">
              <Brand />
              <button
                onClick={() => setOpen(false)}
                className="flex h-9 w-9 items-center justify-center rounded-xl text-white/70 hover:bg-white/10"
                aria-label="メニューを閉じる"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <NavItems onNavigate={() => setOpen(false)} />
            <CompanyCard name={companyName} plan={plan} />
          </aside>
        </div>
      )}
    </>
  );
}

"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  MessageSquareText,
  Activity,
  Settings,
  ChartNoAxesCombined,
  Workflow,
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
            className={`group flex min-h-11 items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-semibold transition-colors duration-150 ${
              active
                ? "bg-[#f4dfb9]/95 text-[#102942] shadow-[0_8px_24px_rgba(3,17,31,0.22)] ring-1 ring-white/35"
                : "text-white/75 hover:bg-white/12 hover:text-white"
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
    <div className="flex items-center gap-3 px-1">
      <div className="relative h-13 w-13 shrink-0 overflow-hidden rounded-full border border-[#f4dfb9]/70 bg-[#ead2a8] shadow-[0_5px_18px_rgba(0,0,0,0.32)]">
        <Image
          src="/brand/webdock-logo.webp"
          alt=""
          fill
          sizes="52px"
          className="object-cover"
          preload
        />
      </div>
      <div className="min-w-0">
        <p className="text-lg font-bold leading-tight tracking-[0.02em] text-white">
          Webドック
        </p>
        <p className="mt-1 text-[10px] font-medium leading-tight tracking-[0.06em] text-[#f4dfb9]/75">
          あなたのWeb健康診断
        </p>
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
      <div className="rounded-xl bg-[#071829]/55 p-3.5 shadow-lg ring-1 ring-white/15 backdrop-blur-sm">
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

function SidebarBackdrop() {
  return (
    <>
      <Image
        src="/brand/sidebar-chart.webp"
        alt=""
        fill
        sizes="(min-width: 1024px) 256px, 288px"
        className="object-cover object-center"
      />
      <div className="absolute inset-0 bg-[#102942]/82 mix-blend-multiply" />
      <div className="absolute inset-0 bg-gradient-to-b from-[#07182a]/55 via-[#102942]/25 to-[#061522]/85" />
      <div className="absolute inset-y-0 right-0 w-px bg-[#f4dfb9]/20" />
    </>
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
      <aside className="relative hidden w-64 shrink-0 overflow-hidden bg-navy lg:block">
        <SidebarBackdrop />
        <div className="relative z-10 flex h-full flex-col gap-7 px-4 py-6">
          <Brand />
          <NavItems />
          <CompanyCard name={companyName} plan={plan} />
        </div>
      </aside>

      {/* モバイル: ドロワー */}
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setOpen(false)}
            aria-hidden
          />
          <aside className="absolute left-0 top-0 h-full w-72 overflow-hidden bg-navy">
            <SidebarBackdrop />
            <div className="relative z-10 flex h-full flex-col gap-7 px-4 py-6">
              <div className="flex items-center justify-between">
                <Brand />
                <button
                  onClick={() => setOpen(false)}
                  className="flex h-11 w-11 items-center justify-center rounded-xl text-white/80 transition-colors hover:bg-white/10 hover:text-white"
                  aria-label="メニューを閉じる"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <NavItems onNavigate={() => setOpen(false)} />
              <CompanyCard name={companyName} plan={plan} />
            </div>
          </aside>
        </div>
      )}
    </>
  );
}

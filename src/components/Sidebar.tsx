"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Bot,
  Plug,
  FileText,
  Users,
  Sparkles,
  Anchor,
  Menu,
  X,
  LogOut,
} from "lucide-react";
import { signOut } from "@/lib/auth-actions";

const nav = [
  { href: "/", label: "ダッシュボード", icon: LayoutDashboard },
  { href: "/ai", label: "Company AI", icon: Bot },
  { href: "/sources", label: "データ連携", icon: Plug },
  { href: "/karte", label: "会社カルテ", icon: FileText },
  { href: "/competitor", label: "競合比較", icon: Users },
  { href: "/gpt", label: "Company GPT", icon: Sparkles, badge: "近日" },
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
            className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors duration-150 ${
              active
                ? "bg-black text-white"
                : "text-gray-600 hover:bg-gray-100 hover:text-black"
            }`}
          >
            <Icon className="h-[18px] w-[18px] shrink-0" strokeWidth={1.75} />
            <span className="flex-1">{item.label}</span>
            {item.badge && (
              <span
                className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                  active ? "bg-white/20 text-white" : "bg-orange-500 text-white"
                }`}
              >
                {item.badge}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}

function Brand() {
  return (
    <div className="flex items-center gap-2.5 px-1">
      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500">
        <Anchor className="h-5 w-5 text-white" strokeWidth={2} />
      </div>
      <div>
        <p className="text-sm font-bold leading-tight text-black">Company Dock</p>
        <p className="text-[11px] leading-tight text-gray-500">NY33 Company</p>
      </div>
    </div>
  );
}

function UserFooter({ email }: { email?: string }) {
  return (
    <div className="mt-auto border-t border-gray-100 pt-4">
      {email && (
        <p className="mb-2 truncate px-3 text-xs text-gray-500" title={email}>
          {email}
        </p>
      )}
      <form action={signOut}>
        <button
          type="submit"
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100 hover:text-black"
        >
          <LogOut className="h-[18px] w-[18px]" strokeWidth={1.75} />
          ログアウト
        </button>
      </form>
    </div>
  );
}

export default function Sidebar({ email }: { email?: string }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* モバイル: 開閉ボタン */}
      <button
        onClick={() => setOpen(true)}
        className="fixed left-4 top-4 z-30 flex h-11 w-11 items-center justify-center rounded-xl bg-white text-black shadow-sm ring-1 ring-black/[0.04] lg:hidden"
        aria-label="メニューを開く"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* デスクトップ: 固定サイドバー（白い浮遊パネル） */}
      <aside className="hidden w-60 shrink-0 flex-col gap-6 rounded-3xl bg-white p-4 shadow-sm ring-1 ring-black/[0.04] lg:flex">
        <Brand />
        <NavItems />
        <UserFooter email={email} />
      </aside>

      {/* モバイル: ドロワー */}
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setOpen(false)}
            aria-hidden
          />
          <aside className="absolute left-0 top-0 flex h-full w-72 flex-col gap-6 bg-white px-4 py-6">
            <div className="flex items-center justify-between">
              <Brand />
              <button
                onClick={() => setOpen(false)}
                className="flex h-9 w-9 items-center justify-center rounded-xl text-gray-500 hover:bg-gray-100"
                aria-label="メニューを閉じる"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <NavItems onNavigate={() => setOpen(false)} />
            <UserFooter email={email} />
          </aside>
        </div>
      )}
    </>
  );
}

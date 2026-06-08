import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { webChecks, type WebCheck } from "@/lib/webdock";
import { CHECK_ICONS } from "./icons";
import { Delta, StatusBadge } from "./bits";

function CheckRow({ check }: { check: WebCheck }) {
  const { Icon, cls } = CHECK_ICONS[check.icon];
  return (
    <li>
      <Link
        href={`/checks/${check.id}`}
        className="grid grid-cols-1 items-center gap-3 px-5 py-3.5 transition-colors hover:bg-surface-2/60 lg:grid-cols-[1fr_140px_90px_80px_110px_24px]"
      >
        {/* 項目 */}
        <div className="flex items-center gap-3">
          <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${cls}`}>
            <Icon className="h-5 w-5" strokeWidth={2} />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold text-foreground">{check.name}</p>
            <p className="truncate text-xs text-muted">{check.subtitle}</p>
          </div>
        </div>

        {/* スコア */}
        <div>
          <div className="flex items-baseline gap-1">
            <span className="text-sm font-bold text-foreground">{check.score}</span>
            <span className="text-[11px] text-muted">/ 100</span>
          </div>
          <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-surface-2">
            <div className="h-full rounded-full bg-good" style={{ width: `${check.score}%` }} />
          </div>
        </div>

        {/* 状態 */}
        <div>
          <StatusBadge status={check.status} />
        </div>

        {/* 前回比 */}
        <div>
          <Delta value={check.delta} />
        </div>

        {/* 最終チェック */}
        <span className="text-xs text-muted">{check.lastCheck}</span>

        {/* chevron */}
        <ChevronRight className="hidden h-4 w-4 text-muted lg:block" />
      </Link>
    </li>
  );
}

export default function CheckList({
  title,
  headerAction,
  checks = webChecks,
}: {
  title?: string;
  headerAction?: React.ReactNode;
  checks?: WebCheck[];
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-surface shadow-sm">
      {(title || headerAction) && (
        <div className="flex items-center justify-between px-5 py-4">
          {title && <h2 className="text-base font-bold text-foreground">{title}</h2>}
          {headerAction}
        </div>
      )}

      {/* ヘッダー行 */}
      <div className="hidden grid-cols-[1fr_140px_90px_80px_110px_24px] gap-3 border-b border-border px-5 py-2.5 text-xs font-medium text-muted lg:grid">
        <span>チェック項目</span>
        <span>スコア</span>
        <span>状態</span>
        <span>前回比</span>
        <span>最終チェック</span>
        <span />
      </div>

      <ul className="divide-y divide-border">
        {checks.map((c) => (
          <CheckRow key={c.id} check={c} />
        ))}
      </ul>
    </div>
  );
}

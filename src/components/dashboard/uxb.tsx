import { ReactNode } from "react";

/* UXBooster パレット */
export const UXB = {
  desk: "#c5c3d1",
  canvas: "#f5f4f0",
  emerald: "#10b981",
  emeraldDark: "#059669",
  yellow: "#facc15",
  orange: "#f97316",
  gray: "#d1d5db",
  ink: "#0a0a0a",
};

/** スコア(0-100)に応じた色 */
export function scoreColor(score: number): string {
  if (score >= 75) return UXB.emerald;
  if (score >= 60) return UXB.yellow;
  if (score >= 45) return UXB.orange;
  return "#ef4444";
}

export function UxbCard({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/[0.04] ${className}`}
    >
      {children}
    </div>
  );
}

export function CardHead({
  title,
  action,
}: {
  title: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-3 flex items-center justify-between">
      <h2 className="text-sm font-semibold text-black sm:text-base">{title}</h2>
      {action}
    </div>
  );
}

/** 円形プログレスリング（中央にアイコン/値） */
export function Ring({
  percent,
  color = UXB.emerald,
  children,
}: {
  percent: number;
  color?: string;
  children: ReactNode;
}) {
  const r = 45;
  const c = 2 * Math.PI * r;
  const offset = c * (1 - Math.min(Math.max(percent, 0), 100) / 100);
  return (
    <div className="relative mx-auto flex h-16 w-16 items-center justify-center sm:h-20 sm:w-20">
      <svg className="absolute inset-0 h-full w-full -rotate-90" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r={r} fill="none" stroke="#f0f0f0" strokeWidth="6" />
        <circle
          cx="50"
          cy="50"
          r={r}
          fill="none"
          stroke={color}
          strokeWidth="6"
          strokeDasharray={c}
          strokeDashoffset={offset}
          strokeLinecap="round"
        />
      </svg>
      <div className="relative z-10 flex h-11 w-11 items-center justify-center rounded-xl bg-white shadow-sm sm:h-14 sm:w-14">
        {children}
      </div>
    </div>
  );
}

type PillTone = "good" | "warn" | "bad" | "neutral";

const pillCls: Record<PillTone, string> = {
  good: "bg-emerald-500 text-white",
  warn: "bg-yellow-400 text-black",
  bad: "bg-orange-500 text-white",
  neutral: "bg-gray-200 text-gray-700",
};

export function StatusPill({
  tone,
  children,
}: {
  tone: PillTone;
  children: ReactNode;
}) {
  return (
    <span
      className={`inline-block rounded-full px-2.5 py-0.5 text-[10px] font-semibold sm:text-xs ${pillCls[tone]}`}
    >
      {children}
    </span>
  );
}

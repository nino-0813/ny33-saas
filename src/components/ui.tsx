import { ReactNode } from "react";

export function Card({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-2xl bg-surface shadow-sm ring-1 ring-black/[0.04] ${className}`}
    >
      {children}
    </div>
  );
}

export function SectionTitle({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-3 flex items-end justify-between gap-3">
      <div>
        <h2 className="text-base font-bold text-foreground">{title}</h2>
        {subtitle && <p className="mt-0.5 text-xs text-muted">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function PageHeader({
  title,
  description,
  icon,
  action,
}: {
  title: string;
  description?: string;
  icon?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div className="flex items-start gap-3">
        {icon && (
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary-weak text-primary">
            {icon}
          </div>
        )}
        <div>
          <h1 className="text-xl font-bold text-foreground">{title}</h1>
          {description && (
            <p className="mt-1 max-w-2xl text-sm text-muted">{description}</p>
          )}
        </div>
      </div>
      {action}
    </div>
  );
}

const rankStyles: Record<string, string> = {
  S: "bg-accent-weak text-accent",
  A: "bg-good-weak text-good",
  B: "bg-primary-weak text-primary",
  C: "bg-warn-weak text-warn",
  D: "bg-bad-weak text-bad",
};

export function RankChip({ rank }: { rank: string }) {
  return (
    <span
      className={`inline-flex h-7 min-w-7 items-center justify-center rounded-md px-2 text-sm font-bold ${rankStyles[rank] ?? rankStyles.B}`}
    >
      {rank}
    </span>
  );
}

export function PriorityStars({ value }: { value: number }) {
  return (
    <span className="text-accent" aria-label={`優先度 ${value} / 5`} title={`優先度 ${value}/5`}>
      {"★".repeat(value)}
      <span className="text-border">{"★".repeat(5 - value)}</span>
    </span>
  );
}

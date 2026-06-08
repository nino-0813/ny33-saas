import { ArrowUp, ArrowDown, Minus, CheckCircle2, AlertTriangle } from "lucide-react";
import type { CheckStatus } from "@/lib/webdock";

export function Delta({
  value,
  prefix,
  unit = "",
}: {
  value: number;
  prefix?: string;
  unit?: string;
}) {
  const up = value > 0;
  const down = value < 0;
  const Icon = up ? ArrowUp : down ? ArrowDown : Minus;
  const cls = up ? "text-good" : down ? "text-bad" : "text-muted";
  const label = value === 0 ? "±0" : `${up ? "+" : ""}${value}`;
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-bold ${cls}`}>
      {prefix && <span className="font-medium text-muted">{prefix}</span>}
      {label}
      {unit}
      <Icon className="h-3.5 w-3.5" />
    </span>
  );
}

export function StatusBadge({ status }: { status: CheckStatus }) {
  if (status === "ok") {
    return (
      <span className="inline-flex items-center gap-1 text-sm font-medium text-good">
        <CheckCircle2 className="h-4 w-4" />
        正常
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-sm font-medium text-warn">
      <AlertTriangle className="h-4 w-4" />
      {status === "bad" ? "要対応" : "注意"}
    </span>
  );
}

import { Hammer } from "lucide-react";

export default function ComingSoon({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center rounded-2xl border border-border bg-surface px-6 py-16 text-center shadow-sm">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-good-weak text-good">
        <Hammer className="h-7 w-7" />
      </div>
      <h2 className="mt-4 text-lg font-bold text-foreground">{title}</h2>
      <p className="mt-1 max-w-sm text-sm text-muted">{description}</p>
      <span className="mt-4 rounded-full bg-surface-2 px-3 py-1 text-xs font-medium text-muted">
        準備中
      </span>
    </div>
  );
}

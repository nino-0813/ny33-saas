import { CheckCircle2, RefreshCw, PlugZap } from "lucide-react";
import { Card, SectionTitle } from "./ui";
import { type DataSource } from "@/lib/mock";

const statusMeta: Record<
  DataSource["status"],
  { label: string; cls: string; Icon: typeof CheckCircle2 }
> = {
  connected: { label: "連携中", cls: "text-good bg-good-weak", Icon: CheckCircle2 },
  syncing: { label: "同期中", cls: "text-primary bg-primary-weak", Icon: RefreshCw },
  disconnected: { label: "未連携", cls: "text-muted bg-surface-2", Icon: PlugZap },
};

export default function DataSources({
  sources,
  showHeader = true,
}: {
  sources: DataSource[];
  showHeader?: boolean;
}) {
  return (
    <section aria-labelledby="sources-title">
      {showHeader && (
        <SectionTitle
          title="データ連携"
          subtitle="GA4・Search Console・Google ビジネス・Instagram・LINE を一元取得"
        />
      )}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {sources.map((src) => {
          const meta = statusMeta[src.status];
          const Icon = meta.Icon;
          return (
            <Card key={src.id} className="flex flex-col p-4">
              <div className="mb-3 flex items-start justify-between gap-2">
                <p className="text-sm font-bold leading-snug text-foreground">
                  {src.name}
                </p>
                <span
                  className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold ${meta.cls}`}
                >
                  <Icon className="h-3 w-3" />
                  {meta.label}
                </span>
              </div>
              <dl className="flex flex-col gap-1.5">
                {src.metrics.map((m) => (
                  <div key={m.label} className="flex items-center justify-between text-xs">
                    <dt className="text-muted">{m.label}</dt>
                    <dd className="tnum font-bold text-foreground">{m.value}</dd>
                  </div>
                ))}
              </dl>
              {src.lastSync && (
                <p className="mt-3 border-t border-border pt-2 text-[11px] text-muted">
                  最終同期 {src.lastSync}
                </p>
              )}
            </Card>
          );
        })}
      </div>
    </section>
  );
}

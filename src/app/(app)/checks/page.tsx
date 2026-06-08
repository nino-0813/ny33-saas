import { CheckCircle2, AlertTriangle } from "lucide-react";
import CheckList from "@/components/checks/CheckList";
import { webChecks } from "@/lib/webdock";
import { getMeasuredMap } from "@/lib/checks-data";

export const metadata = { title: "チェック結果 — Webドック" };

export default async function ChecksPage() {
  const measured = await getMeasuredMap();
  const effStatus = (c: (typeof webChecks)[number]) =>
    measured.get(c.id)?.status ?? c.status;
  const ok = webChecks.filter((c) => effStatus(c) === "ok").length;
  const warn = webChecks.length - ok;

  return (
    <div className="space-y-5">
      {/* サマリー */}
      <div className="grid grid-cols-2 gap-4 sm:max-w-md">
        <div className="flex items-center gap-3 rounded-2xl border border-border bg-surface p-4 shadow-sm">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-good-weak text-good">
            <CheckCircle2 className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs text-muted">正常</p>
            <p className="text-2xl font-bold text-foreground">
              {ok}
              <span className="ml-1 text-sm text-muted">件</span>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-2xl border border-border bg-surface p-4 shadow-sm">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-warn-weak text-warn">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs text-muted">要対応</p>
            <p className="text-2xl font-bold text-foreground">
              {warn}
              <span className="ml-1 text-sm text-muted">件</span>
            </p>
          </div>
        </div>
      </div>

      {/* 一覧 */}
      <CheckList title="チェック項目の一覧" overrides={measured} />
    </div>
  );
}

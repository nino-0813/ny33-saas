import Link from "next/link";
import { redirect } from "next/navigation";
import { Circle, Clock, CheckCircle2, ChevronRight } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { improvementTasks, type Priority } from "@/lib/webdock";
import { setTaskStatus } from "@/lib/task-actions";

export const metadata = { title: "改善タスク — Webドック" };

type Status = "todo" | "doing" | "done";

const PRIORITY_META: Record<Priority, { label: string; cls: string; order: number }> = {
  high: { label: "優先度：高", cls: "bg-red-50 text-red-600", order: 0 },
  mid: { label: "優先度：中", cls: "bg-amber-50 text-amber-600", order: 1 },
  low: { label: "優先度：低", cls: "bg-blue-50 text-blue-600", order: 2 },
};

const STATUS_TABS: { value: Status; label: string }[] = [
  { value: "todo", label: "未対応" },
  { value: "doing", label: "対応中" },
  { value: "done", label: "完了" },
];

export default async function TasksPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: company } = await supabase
    .from("companies")
    .select("id")
    .eq("owner_id", user.id)
    .maybeSingle();

  const { data: rows } = company
    ? await supabase
        .from("task_status")
        .select("task_key, status")
        .eq("company_id", company.id)
    : { data: [] };
  const statusMap = new Map<string, Status>(
    (rows ?? []).map((r) => [r.task_key, r.status as Status]),
  );

  const tasks = improvementTasks
    .map((t) => ({ ...t, status: statusMap.get(t.key) ?? ("todo" as Status) }))
    .sort((a, b) => {
      const sOrder = { todo: 0, doing: 1, done: 2 };
      if (sOrder[a.status] !== sOrder[b.status]) return sOrder[a.status] - sOrder[b.status];
      return PRIORITY_META[a.priority].order - PRIORITY_META[b.priority].order;
    });

  const counts = {
    todo: tasks.filter((t) => t.status === "todo").length,
    doing: tasks.filter((t) => t.status === "doing").length,
    done: tasks.filter((t) => t.status === "done").length,
  };

  return (
    <div className="space-y-5">
      {/* サマリー */}
      <div className="grid grid-cols-3 gap-4 sm:max-w-2xl">
        <SummaryCard icon={<Circle className="h-5 w-5" />} label="未対応" value={counts.todo} cls="bg-slate-100 text-slate-500" />
        <SummaryCard icon={<Clock className="h-5 w-5" />} label="対応中" value={counts.doing} cls="bg-blue-50 text-blue-600" />
        <SummaryCard icon={<CheckCircle2 className="h-5 w-5" />} label="完了" value={counts.done} cls="bg-good-weak text-good" />
      </div>

      {/* タスク一覧 */}
      <div className="overflow-hidden rounded-2xl border border-border bg-surface shadow-sm">
        <div className="px-5 py-4">
          <h2 className="text-base font-bold text-foreground">改善タスク一覧</h2>
          <p className="mt-0.5 text-xs text-muted">AIが各チェックから抽出したおすすめアクションです</p>
        </div>
        <ul className="divide-y divide-border">
          {tasks.map((t) => {
            const meta = PRIORITY_META[t.priority];
            return (
              <li
                key={t.key}
                className={`flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center ${
                  t.status === "done" ? "opacity-60" : ""
                }`}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className={`shrink-0 rounded-md px-2 py-0.5 text-[11px] font-bold ${meta.cls}`}>
                      {meta.label}
                    </span>
                    <Link
                      href={`/checks/${t.checkId}`}
                      className="inline-flex items-center gap-0.5 text-[11px] text-muted hover:text-good hover:underline"
                    >
                      {t.checkName}
                      <ChevronRight className="h-3 w-3" />
                    </Link>
                  </div>
                  <p
                    className={`mt-1.5 text-sm font-medium text-foreground ${
                      t.status === "done" ? "line-through" : ""
                    }`}
                  >
                    {t.text}
                  </p>
                </div>

                {/* 状態切替（3ボタン） */}
                <form action={setTaskStatus} className="flex shrink-0 rounded-lg bg-surface-2 p-0.5">
                  <input type="hidden" name="task_key" value={t.key} />
                  {STATUS_TABS.map((s) => (
                    <button
                      key={s.value}
                      type="submit"
                      name="status"
                      value={s.value}
                      className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                        t.status === s.value
                          ? "bg-surface text-foreground shadow-sm"
                          : "text-muted hover:text-foreground"
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </form>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}

function SummaryCard({
  icon,
  label,
  value,
  cls,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  cls: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-border bg-surface p-4 shadow-sm">
      <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${cls}`}>{icon}</div>
      <div>
        <p className="text-xs text-muted">{label}</p>
        <p className="text-2xl font-bold text-foreground">
          {value}
          <span className="ml-1 text-sm text-muted">件</span>
        </p>
      </div>
    </div>
  );
}

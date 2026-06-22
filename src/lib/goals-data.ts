import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { GoalStep } from "@/lib/goal-actions";

export interface Goal {
  id: string;
  title: string;
  targetLabel: string;
  detail: string;
  dueDate: string | null;
  status: "active" | "done" | "archived";
  steps: GoalStep[];
}

/** 現在進行中の目標（active）を1件取得。なければ最後に達成した目標を返す。 */
export async function getCurrentGoal(): Promise<Goal | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: company } = await supabase
    .from("companies")
    .select("id")
    .eq("owner_id", user.id)
    .maybeSingle();
  if (!company) return null;

  const { data } = await supabase
    .from("goals")
    .select("*")
    .eq("company_id", company.id)
    .in("status", ["active", "done"])
    .order("status", { ascending: true }) // active が先
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!data) return null;
  return {
    id: data.id,
    title: data.title,
    targetLabel: data.target_label,
    detail: data.detail,
    dueDate: data.due_date,
    status: data.status as Goal["status"],
    steps: (data.steps as unknown as GoalStep[]) ?? [],
  };
}

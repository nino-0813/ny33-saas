"use server";

import { revalidatePath } from "next/cache";
import { randomUUID } from "crypto";
import { createClient } from "@/lib/supabase/server";
import type { Json } from "@/lib/database.types";

export interface GoalStep {
  id: string;
  text: string;
  done: boolean;
}

async function resolveCompanyId(): Promise<string | null> {
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
  return company?.id ?? null;
}

/** 新しい目標を作成（作成中の active 目標は1つに保つため、既存 active は archived へ） */
export async function createGoal(input: {
  title: string;
  target_label?: string;
  detail?: string;
  due_date?: string | null;
  steps?: string[];
}): Promise<{ ok: boolean; error?: string }> {
  const title = input.title.trim();
  if (!title) return { ok: false, error: "目標を入力してください。" };

  const supabase = await createClient();
  const companyId = await resolveCompanyId();
  if (!companyId) return { ok: false, error: "ログインが必要です。" };

  const steps: GoalStep[] = (input.steps ?? [])
    .map((t) => t.trim())
    .filter(Boolean)
    .map((text) => ({ id: randomUUID(), text, done: false }));

  // 既存の active 目標は archived にして、常に1つの目標に集中させる
  await supabase
    .from("goals")
    .update({ status: "archived", updated_at: new Date().toISOString() })
    .eq("company_id", companyId)
    .eq("status", "active");

  const { error } = await supabase.from("goals").insert({
    company_id: companyId,
    title,
    target_label: input.target_label?.trim() ?? "",
    detail: input.detail?.trim() ?? "",
    due_date: input.due_date || null,
    steps: steps as unknown as Json,
    status: "active",
  });

  if (error) return { ok: false, error: "目標を保存できませんでした。" };
  revalidatePath("/");
  return { ok: true };
}

/** ステップの完了状態をトグル。全ステップ完了なら目標を done に。 */
export async function toggleGoalStep(
  goalId: string,
  stepId: string,
): Promise<{ ok: boolean }> {
  const supabase = await createClient();
  const companyId = await resolveCompanyId();
  if (!companyId) return { ok: false };

  const { data: goal } = await supabase
    .from("goals")
    .select("steps, status")
    .eq("id", goalId)
    .eq("company_id", companyId)
    .maybeSingle();
  if (!goal) return { ok: false };

  const steps = (goal.steps as unknown as GoalStep[]).map((s) =>
    s.id === stepId ? { ...s, done: !s.done } : s,
  );
  const allDone = steps.length > 0 && steps.every((s) => s.done);

  await supabase
    .from("goals")
    .update({
      steps: steps as unknown as Json,
      status: allDone ? "done" : "active",
      updated_at: new Date().toISOString(),
    })
    .eq("id", goalId)
    .eq("company_id", companyId);

  revalidatePath("/");
  return { ok: true };
}

/** 目標の状態を変更（達成 / アーカイブ / 再開） */
export async function setGoalStatus(
  goalId: string,
  status: "active" | "done" | "archived",
): Promise<void> {
  const supabase = await createClient();
  const companyId = await resolveCompanyId();
  if (!companyId) return;
  await supabase
    .from("goals")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", goalId)
    .eq("company_id", companyId);
  revalidatePath("/");
}

export async function deleteGoal(goalId: string): Promise<void> {
  const supabase = await createClient();
  const companyId = await resolveCompanyId();
  if (!companyId) return;
  await supabase.from("goals").delete().eq("id", goalId).eq("company_id", companyId);
  revalidatePath("/");
}

"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

const VALID = new Set(["todo", "doing", "done"]);

/** タスクの対応状況を保存（フォームの submit ボタンから呼ぶ） */
export async function setTaskStatus(formData: FormData): Promise<void> {
  const taskKey = String(formData.get("task_key") ?? "");
  const status = String(formData.get("status") ?? "todo");
  if (!taskKey || !VALID.has(status)) return;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const { data: company } = await supabase
    .from("companies")
    .select("id")
    .eq("owner_id", user.id)
    .maybeSingle();
  if (!company) return;

  await supabase.from("task_status").upsert(
    {
      company_id: company.id,
      task_key: taskKey,
      status,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "company_id,task_key" },
  );

  revalidatePath("/tasks");
}

"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export interface CheckSettingsState {
  ok?: boolean;
  message?: string;
  error?: string;
}

const VALID_FREQ = new Set(["daily", "weekly", "monthly"]);

function clampScore(v: number): number {
  return Math.max(0, Math.min(100, Math.round(v)));
}

export async function saveCheckSettings(
  _prev: CheckSettingsState,
  formData: FormData,
): Promise<CheckSettingsState> {
  const checkKey = String(formData.get("check_key") ?? "");
  if (!checkKey) return { error: "不正なチェックです" };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "ログインが必要です" };

  const { data: company } = await supabase
    .from("companies")
    .select("id")
    .eq("owner_id", user.id)
    .maybeSingle();
  if (!company) return { error: "会社が見つかりません" };

  const freqRaw = String(formData.get("frequency") ?? "weekly");
  const frequency = VALID_FREQ.has(freqRaw) ? freqRaw : "weekly";

  const { error } = await supabase.from("check_settings").upsert(
    {
      company_id: company.id,
      check_key: checkKey,
      enabled: formData.get("enabled") != null,
      target_score: clampScore(Number(formData.get("target_score") ?? 80)),
      alert_threshold: clampScore(Number(formData.get("alert_threshold") ?? 60)),
      frequency,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "company_id,check_key" },
  );

  if (error) return { error: "保存に失敗しました" };

  revalidatePath(`/checks/${checkKey}`);
  revalidatePath("/checks");
  return { ok: true, message: "設定を保存しました" };
}

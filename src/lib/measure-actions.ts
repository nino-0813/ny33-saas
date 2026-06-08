"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { measureCheck, MEASURABLE } from "@/lib/measure";
import type { Json } from "@/lib/database.types";

export interface MeasureState {
  ok?: boolean;
  message?: string;
  error?: string;
}

export async function runCheckAction(
  _prev: MeasureState,
  formData: FormData,
): Promise<MeasureState> {
  const checkKey = String(formData.get("check_key") ?? "");
  if (!MEASURABLE.has(checkKey)) {
    return { error: "このチェックは自動計測にまだ対応していません" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "ログインが必要です" };

  const { data: company } = await supabase
    .from("companies")
    .select("id, website_url")
    .eq("owner_id", user.id)
    .maybeSingle();
  if (!company) return { error: "会社が見つかりません" };

  const url = (company.website_url || "").trim();
  if (!url) {
    return { error: "会社サイトのURLが未設定です。「会社情報」で登録してください。" };
  }

  let result;
  try {
    result = await measureCheck(checkKey, url);
  } catch (e) {
    return { error: e instanceof Error ? e.message : "計測に失敗しました" };
  }

  const { error } = await supabase.from("check_results").upsert(
    {
      company_id: company.id,
      check_key: checkKey,
      score: result.score,
      status: result.status,
      metrics: result.metrics as unknown as Json,
      note: result.note,
      measured_at: new Date().toISOString(),
    },
    { onConflict: "company_id,check_key" },
  );
  if (error) return { error: "結果の保存に失敗しました" };

  revalidatePath(`/checks/${checkKey}`);
  revalidatePath("/checks");
  revalidatePath("/");
  return { ok: true, message: `計測しました（スコア ${result.score}/100）` };
}

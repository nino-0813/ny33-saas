"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCheckRealData, getMeasuredResult } from "@/lib/checks-data";
import { generateCheckDiagnosis, hasAnthropicKey } from "@/lib/ai/diagnose";
import { getCheck, checkDetails, type SubMetric } from "@/lib/webdock";
import type { Json as DbJson } from "@/lib/database.types";

export interface AiState {
  ok?: boolean;
  message?: string;
  error?: string;
}

export async function generateDiagnosisAction(
  _prev: AiState,
  formData: FormData,
): Promise<AiState> {
  const checkKey = String(formData.get("check_key") ?? "");
  const check = getCheck(checkKey);
  const detail = checkDetails[checkKey];
  if (!check || !detail) return { error: "不正なチェックです" };

  if (!hasAnthropicKey()) {
    return {
      error: "AI連携が未設定です（ANTHROPIC_API_KEY を設定してください）。",
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "ログインが必要です" };

  const { data: company } = await supabase
    .from("companies")
    .select("id, name, industry")
    .eq("owner_id", user.id)
    .maybeSingle();
  if (!company) return { error: "会社が見つかりません" };

  // スコア・状態・指標を 実測 > 連携実データ > サンプル の優先で解決
  const measured = await getMeasuredResult(company.id, checkKey);
  const real = await getCheckRealData(company.id, checkKey);
  const subMetrics: SubMetric[] = measured
    ? measured.subMetrics
    : real.isReal && real.subMetrics
      ? real.subMetrics
      : detail.subMetrics;
  const score = measured?.score ?? check.score;
  const status = measured?.status ?? check.status;

  let result;
  try {
    result = await generateCheckDiagnosis({
      companyName: company.name,
      industry: company.industry,
      checkName: check.name,
      checkSubtitle: check.subtitle,
      score,
      status,
      subMetrics,
    });
  } catch (e) {
    return { error: e instanceof Error ? e.message : "AI診断の生成に失敗しました" };
  }

  const { error } = await supabase.from("ai_diagnoses").upsert(
    {
      company_id: company.id,
      check_key: checkKey,
      summary: result.summary,
      good_points: result.goodPoints as unknown as DbJson,
      improve_points: result.improvePoints as unknown as DbJson,
      actions: result.actions as unknown as DbJson,
      model: result.model,
      created_at: new Date().toISOString(),
    },
    { onConflict: "company_id,check_key" },
  );
  if (error) return { error: "保存に失敗しました" };

  revalidatePath(`/checks/${checkKey}`);
  return { ok: true, message: "AI診断を生成しました" };
}

"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export interface CompanyState {
  ok?: boolean;
  message?: string;
  error?: string;
}

export async function updateCompany(
  _prev: CompanyState,
  formData: FormData,
): Promise<CompanyState> {
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { error: "会社名を入力してください" };

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

  const { error } = await supabase
    .from("companies")
    .update({
      name,
      industry: String(formData.get("industry") ?? "").trim(),
      area: String(formData.get("area") ?? "").trim(),
      website_url: String(formData.get("website_url") ?? "").trim(),
      description: String(formData.get("description") ?? "").trim(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", company.id);

  if (error) return { error: "保存に失敗しました" };

  // サイドバーの会社名も更新するためレイアウトごと再検証
  revalidatePath("/", "layout");
  return { ok: true, message: "会社情報を保存しました" };
}

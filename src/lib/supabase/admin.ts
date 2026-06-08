import "server-only";
import { createClient as createSbClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";

/**
 * サービスロールキーを使う管理クライアント（サーバー専用）。
 * RLS をバイパスするため、google_oauth など publishable から不可視なテーブルにアクセスする用途に限定して使う。
 * 絶対にクライアントへ漏らさないこと（NEXT_PUBLIC_ を付けない）。
 */
export function hasServiceRole(): boolean {
  return Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY);
}

export function createAdminClient() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY が未設定です（.env.local に設定してください）",
    );
  }
  return createSbClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    key,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}

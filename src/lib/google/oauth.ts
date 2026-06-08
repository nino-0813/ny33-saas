import "server-only";
import { OAuth2Client } from "google-auth-library";
import { createAdminClient, hasServiceRole } from "@/lib/supabase/admin";

export const GA_SCOPE = "https://www.googleapis.com/auth/analytics.readonly";
export const GSC_SCOPE = "https://www.googleapis.com/auth/webmasters.readonly";
const EMAIL_SCOPE = "https://www.googleapis.com/auth/userinfo.email";

export const OAUTH_SCOPES = [GA_SCOPE, GSC_SCOPE, EMAIL_SCOPE, "openid"];

export function hasOAuthConfig(): boolean {
  return Boolean(
    process.env.GOOGLE_OAUTH_CLIENT_ID &&
      process.env.GOOGLE_OAUTH_CLIENT_SECRET &&
      process.env.GOOGLE_OAUTH_REDIRECT_URI &&
      hasServiceRole(),
  );
}

export function getOAuthClient(): OAuth2Client {
  return new OAuth2Client(
    process.env.GOOGLE_OAUTH_CLIENT_ID,
    process.env.GOOGLE_OAUTH_CLIENT_SECRET,
    process.env.GOOGLE_OAUTH_REDIRECT_URI,
  );
}

/** 同意画面URL（refresh_token を確実に得るため offline + consent） */
export function getAuthUrl(state: string): string {
  return getOAuthClient().generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: OAUTH_SCOPES,
    state,
    include_granted_scopes: true,
  });
}

export interface ExchangeResult {
  refreshToken: string | null;
  accessToken: string | null;
  expiry: string | null;
  scope: string;
  email: string;
}

/** 認可コード → トークン＋メール */
export async function exchangeCode(code: string): Promise<ExchangeResult> {
  const client = getOAuthClient();
  const { tokens } = await client.getToken(code);
  client.setCredentials(tokens);

  let email = "";
  try {
    const res = await fetch(
      "https://www.googleapis.com/oauth2/v2/userinfo",
      { headers: { Authorization: `Bearer ${tokens.access_token}` } },
    );
    if (res.ok) {
      const info = (await res.json()) as { email?: string };
      email = info.email ?? "";
    }
  } catch {
    // メール取得失敗は致命的ではない
  }

  return {
    refreshToken: tokens.refresh_token ?? null,
    accessToken: tokens.access_token ?? null,
    expiry: tokens.expiry_date ? new Date(tokens.expiry_date).toISOString() : null,
    scope: tokens.scope ?? "",
    email,
  };
}

/** 連携トークンを保存（admin） */
export async function saveTokens(
  companyId: string,
  t: ExchangeResult,
): Promise<void> {
  const admin = createAdminClient();
  // refresh_token は再同意しないと再発行されないため、無い場合は既存を保持
  await admin.from("google_oauth").upsert(
    {
      company_id: companyId,
      access_token: t.accessToken,
      token_expiry: t.expiry,
      scope: t.scope,
      google_email: t.email,
      updated_at: new Date().toISOString(),
      ...(t.refreshToken ? { refresh_token: t.refreshToken } : {}),
    },
    { onConflict: "company_id" },
  );
}

export interface GoogleConnection {
  email: string;
}

/** 連携状態（メールのみ。トークンは返さない） */
export async function getConnection(
  companyId: string,
): Promise<GoogleConnection | null> {
  if (!hasServiceRole()) return null;
  const admin = createAdminClient();
  const { data } = await admin
    .from("google_oauth")
    .select("google_email, refresh_token")
    .eq("company_id", companyId)
    .maybeSingle();
  if (!data || !data.refresh_token) return null;
  return { email: data.google_email };
}

/**
 * 会社の有効なアクセストークンを返す（必要なら更新）。未連携なら null。
 * サーバー専用。トークンはクライアントへ返さない用途で使う。
 */
export async function getAccessTokenForCompany(
  companyId: string,
): Promise<string | null> {
  if (!hasOAuthConfig()) return null;
  const admin = createAdminClient();
  const { data } = await admin
    .from("google_oauth")
    .select("refresh_token, access_token, token_expiry")
    .eq("company_id", companyId)
    .maybeSingle();
  if (!data?.refresh_token) return null;

  // 既存トークンが60秒以上有効ならそのまま使う
  const exp = data.token_expiry ? Date.parse(data.token_expiry) : 0;
  if (data.access_token && exp - Date.now() > 60_000) {
    return data.access_token;
  }

  // 更新
  const client = getOAuthClient();
  client.setCredentials({ refresh_token: data.refresh_token });
  const { token } = await client.getAccessToken();
  if (!token) return null;

  const creds = client.credentials;
  await admin
    .from("google_oauth")
    .update({
      access_token: token,
      token_expiry: creds.expiry_date
        ? new Date(creds.expiry_date).toISOString()
        : null,
      updated_at: new Date().toISOString(),
    })
    .eq("company_id", companyId);

  return token;
}

/** 連携解除 */
export async function deleteConnection(companyId: string): Promise<void> {
  const admin = createAdminClient();
  await admin.from("google_oauth").delete().eq("company_id", companyId);
}

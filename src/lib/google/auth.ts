import "server-only";
import { JWT } from "google-auth-library";

/**
 * サービスアカウントの認証情報が設定されているか
 */
export function hasGoogleCredentials(): boolean {
  return Boolean(
    process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL &&
      process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY,
  );
}

/** 認証情報未設定を表すエラー（呼び出し側で日本語メッセージに変換） */
export class MissingCredentialsError extends Error {
  constructor() {
    super("GOOGLE_SERVICE_ACCOUNT credentials are not configured");
    this.name = "MissingCredentialsError";
  }
}

/**
 * サービスアカウントから指定スコープのアクセストークンを発行する。
 * .env.local の GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY は "\n" を実改行へ変換。
 */
export async function getAccessToken(scopes: string[]): Promise<string> {
  if (!hasGoogleCredentials()) throw new MissingCredentialsError();

  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL!;
  const key = process.env
    .GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY!.replace(/\\n/g, "\n")
    .trim();

  const jwt = new JWT({ email, key, scopes });
  const { access_token } = await jwt.authorize();
  if (!access_token) {
    throw new Error("アクセストークンの取得に失敗しました");
  }
  return access_token;
}

export const GA_SCOPE = "https://www.googleapis.com/auth/analytics.readonly";
export const GSC_SCOPE = "https://www.googleapis.com/auth/webmasters.readonly";

import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { exchangeCode, saveTokens } from "@/lib/google/oauth";

export async function GET(request: NextRequest) {
  const origin = request.nextUrl.origin;
  const params = request.nextUrl.searchParams;
  const code = params.get("code");
  const state = params.get("state");
  const error = params.get("error");

  if (error) {
    return NextResponse.redirect(`${origin}/sources?google=denied`);
  }

  // CSRF: Cookie の state と一致確認
  const cookieState = request.cookies.get("g_oauth_state")?.value;
  if (!code || !state || !cookieState || state !== cookieState) {
    return NextResponse.redirect(`${origin}/sources?google=invalid`);
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(`${origin}/login`);

  const { data: company } = await supabase
    .from("companies")
    .select("id")
    .eq("owner_id", user.id)
    .maybeSingle();
  if (!company) return NextResponse.redirect(`${origin}/onboarding`);

  try {
    const tokens = await exchangeCode(code);
    if (!tokens.refreshToken) {
      // 既に連携済みで再同意していない等。再同意を促す。
      const { data: existing } = await (await import("@/lib/supabase/admin"))
        .createAdminClient()
        .from("google_oauth")
        .select("refresh_token")
        .eq("company_id", company.id)
        .maybeSingle();
      if (!existing?.refresh_token) {
        return NextResponse.redirect(`${origin}/sources?google=norefresh`);
      }
    }
    await saveTokens(company.id, tokens);
  } catch {
    return NextResponse.redirect(`${origin}/sources?google=error`);
  }

  const res = NextResponse.redirect(`${origin}/sources?google=connected`);
  res.cookies.delete("g_oauth_state");
  return res;
}

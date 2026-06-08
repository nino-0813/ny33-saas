import { NextResponse, type NextRequest } from "next/server";
import { randomBytes } from "crypto";
import { createClient } from "@/lib/supabase/server";
import { getAuthUrl, hasOAuthConfig } from "@/lib/google/oauth";

export async function GET(request: NextRequest) {
  const origin = request.nextUrl.origin;

  if (!hasOAuthConfig()) {
    return NextResponse.redirect(`${origin}/sources?google=unconfigured`);
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.redirect(`${origin}/login`);
  }

  const state = randomBytes(16).toString("hex");
  const url = getAuthUrl(state);

  const res = NextResponse.redirect(url);
  // CSRF 用 state を短命 Cookie に保存
  res.cookies.set("g_oauth_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 600,
  });
  return res;
}

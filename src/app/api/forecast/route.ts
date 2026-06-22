import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

export const maxDuration = 60;

const requestSchema = z.object({
  dates: z.array(z.string().min(1)).min(20).max(15000),
  values: z.array(z.number().finite()).min(20).max(15000),
  frequency: z.enum(["h", "D", "W", "MS", "QS"]),
  horizon: z.number().int().min(1).max(1000),
  non_negative: z.boolean().default(true),
});

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "ログインが必要です。" }, { status: 401 });

  let payload: z.infer<typeof requestSchema>;
  try {
    payload = requestSchema.parse(await request.json());
  } catch {
    return Response.json(
      { error: "入力データの形式が正しくありません。" },
      { status: 400 },
    );
  }

  if (payload.dates.length !== payload.values.length) {
    return Response.json(
      { error: "日付と数値の件数が一致していません。" },
      { status: 400 },
    );
  }

  const serviceUrl = process.env.TIMESFM_API_URL ?? "http://127.0.0.1:8000";
  const headers: HeadersInit = { "Content-Type": "application/json" };
  if (process.env.TIMESFM_API_KEY) {
    headers.Authorization = `Bearer ${process.env.TIMESFM_API_KEY}`;
  }

  try {
    const response = await fetch(`${serviceUrl.replace(/\/$/, "")}/forecast`, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(55_000),
      cache: "no-store",
    });
    const data = (await response.json()) as { detail?: string; error?: string };
    if (!response.ok) {
      return Response.json(
        { error: data.detail || data.error || "TimesFMの予測に失敗しました。" },
        { status: response.status >= 500 ? 502 : response.status },
      );
    }
    return Response.json(data);
  } catch (error) {
    const detail =
      error instanceof Error && error.name === "TimeoutError"
        ? "予測処理がタイムアウトしました。期間を短くして再度お試しください。"
        : "TimesFM予測サービスに接続できません。管理者にお問い合わせください。";
    return Response.json({ error: detail }, { status: 503 });
  }
}

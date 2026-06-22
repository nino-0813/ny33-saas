import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { buildMarketingContext, streamChat } from "@/lib/ai/chat";

export const maxDuration = 60;

const requestSchema = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().min(1).max(8000),
      }),
    )
    .min(1)
    .max(40),
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
    return Response.json({ error: "入力の形式が正しくありません。" }, { status: 400 });
  }

  const context = await buildMarketingContext();
  const stream = await streamChat(payload.messages, context);

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}

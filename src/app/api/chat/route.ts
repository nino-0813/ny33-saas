import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { buildMarketingContext, streamChat } from "@/lib/ai/chat";
import { getFunnelData } from "@/lib/funnel-data";
import {
  getFunnelInsight,
  isFunnelKey,
} from "@/lib/funnel-insights";

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
  topic: z.string().optional(),
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

  let context = await buildMarketingContext();
  if (payload.topic && isFunnelKey(payload.topic)) {
    const funnel = await getFunnelData();
    const insight = getFunnelInsight(payload.topic, funnel.signals);
    const score = Math.round(
      (funnel.stages?.find((item) => item.key === payload.topic)?.rate ?? 0) * 100,
    );
    context += `\n\n# 今回の相談テーマ（ファネル評価）
- 段階: ${insight.name}
- スコア: ${score}/100
- 実績: ${insight.actual}
- 評価目安: ${insight.target}
- 計算方法: ${insight.formula}
- 現状判断: ${insight.interpretation}
- 推奨施策: ${insight.actions.map((action) => `${action.title}（${action.detail}）`).join(" / ")}

この相談では上記テーマを最優先し、会社の実測データと結びつけて具体的に回答してください。`;
  }
  const stream = await streamChat(payload.messages, context);

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}

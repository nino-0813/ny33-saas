import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAIClient, stripThinking } from "@/lib/ai/provider";
import { buildMarketingContext } from "@/lib/ai/chat";

export const maxDuration = 60;

const SuggestSchema = z.object({
  title: z.string().min(1).max(80),
  target_label: z.string().max(60).default(""),
  steps: z.array(z.string().min(1).max(120)).min(1).max(6),
});

/** qwen3 は steps を ["..."] / [{step:"..."}] / [{text:"..."}] 等で返すため文字列配列へ正規化する */
function normalizeSteps(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      if (typeof item === "string") return item;
      if (item && typeof item === "object") {
        const obj = item as Record<string, unknown>;
        const candidate =
          obj.step ?? obj.text ?? obj.title ?? obj.action ?? obj.name;
        if (typeof candidate === "string") return candidate;
        const firstString = Object.values(obj).find((v) => typeof v === "string");
        return typeof firstString === "string" ? firstString : "";
      }
      return "";
    })
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 6);
}

const SYSTEM = `あなたは中小企業のWeb集客を支援するプロのWebマーケターです。
会社の最新データを踏まえ、今月取り組む「1つの集客目標」と、それを達成するための実行ステップを設計します。
必ず次のJSONのみを出力してください（前後に文章や記号を付けない）:
{"title":"目標(1文)","target_label":"数値目標(例: 問い合わせ20件/月)","steps":["具体的な実行ステップ", "..."]}
- title は前向きで具体的に。target_label は測れる指標を1つ。
- steps は今日から着手できる粒度で2〜5個。専門用語は避ける。
/no_think`;

export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "ログインが必要です。" }, { status: 401 });

  const context = await buildMarketingContext();
  const { client, model } = createAIClient();

  try {
    const completion = await client.chat.completions.create({
      model,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: SYSTEM },
        { role: "user", content: `# 会社の最新データ\n${context}\n\n上記をもとに目標案をJSONで出してください。` },
      ],
    });
    const content = completion.choices[0]?.message?.content ?? "";
    const raw = JSON.parse(stripThinking(content)) as Record<string, unknown>;
    const parsed = SuggestSchema.parse({
      title: raw.title,
      target_label: raw.target_label ?? "",
      steps: normalizeSteps(raw.steps),
    });
    return Response.json(parsed);
  } catch (error) {
    console.error("goal suggest error", error);
    return Response.json(
      { error: "目標案の生成に失敗しました。時間をおいて再度お試しください。" },
      { status: 502 },
    );
  }
}

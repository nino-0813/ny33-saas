import "server-only";
import { z } from "zod";
import type { SubMetric } from "@/lib/webdock";
import { createAIClient, stripThinking } from "@/lib/ai/provider";

export const DiagnosisSchema = z.object({
  summary: z.string(),
  goodPoints: z.array(z.string()),
  improvePoints: z.array(z.string()),
  actions: z.array(
    z.object({
      text: z.string(),
      priority: z.enum(["high", "mid", "low"]),
    }),
  ),
});

export type Diagnosis = z.infer<typeof DiagnosisSchema>;
export interface DiagnosisResult extends Diagnosis {
  model: string;
}

// OpenAI Structured Outputs 用の JSON Schema（strict モード）
const JSON_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    summary: { type: "string", description: "全体の所見を1〜2文で（日本語）" },
    goodPoints: {
      type: "array",
      items: { type: "string" },
      description: "良い点（0〜3個、日本語）",
    },
    improvePoints: {
      type: "array",
      items: { type: "string" },
      description: "改善点（0〜3個、日本語）",
    },
    actions: {
      type: "array",
      description: "おすすめアクション（0〜3個）",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          text: { type: "string", description: "具体的なアクション（日本語）" },
          priority: { type: "string", enum: ["high", "mid", "low"] },
        },
        required: ["text", "priority"],
      },
    },
  },
  required: ["summary", "goodPoints", "improvePoints", "actions"],
} as const;

/** 後方互換: AI（OpenAI もしくは Ollama）が利用可能か */
export function hasOpenAIKey(): boolean {
  return Boolean(process.env.OPENAI_API_KEY ?? process.env.OLLAMA_BASE_URL);
}

export interface DiagnoseInput {
  companyName: string;
  industry: string;
  checkName: string;
  checkSubtitle: string;
  score: number;
  status: "ok" | "warn" | "bad";
  subMetrics: SubMetric[];
}

const SYSTEM = `あなたは中小企業のWeb集客を支援するプロのWebコンサルタントです。
与えられた「Webチェック項目」の指標・スコア・状態を読み解き、その企業の担当者（非エンジニア）に向けて、
やさしく具体的で実行可能な診断を日本語で作成します。
- 専門用語は避けるか、避けられない場合は短く補足する
- 改善点には必ず「次に何をすればよいか」が分かる具体性を持たせる
- actions の priority は high/mid/low のいずれか。緊急で効果が大きいものを high にする
- 事実にない数値を作らない。与えられた指標の範囲で述べる`;

export async function generateCheckDiagnosis(
  input: DiagnoseInput,
): Promise<DiagnosisResult> {
  const { client, model, supportsStrictJson } = createAIClient();

  const statusLabel =
    input.status === "ok" ? "正常" : input.status === "warn" ? "注意" : "要対応";
  const metricsText = input.subMetrics
    .map((m) => `- ${m.label}: ${m.value}${m.sub ? `（${m.sub}）` : ""}`)
    .join("\n");

  const userText = `# 会社
${input.companyName}（業種: ${input.industry || "不明"}）

# チェック項目
${input.checkName} — ${input.checkSubtitle}

# 現在のスコア・状態
スコア: ${input.score}/100（状態: ${statusLabel}）

# 指標
${metricsText || "（指標データなし）"}

上記をもとに、この企業向けの診断（summary / goodPoints / improvePoints / actions）を作成してください。
JSON以外は出力しないでください。`;

  const completion = await client.chat.completions.create({
    model,
    messages: [
      { role: "system", content: SYSTEM },
      { role: "user", content: userText },
    ],
    // OpenAI は strict json_schema、Ollama 等は json_object + zod 検証で対応する。
    response_format: supportsStrictJson
      ? {
          type: "json_schema",
          json_schema: { name: "diagnosis", strict: true, schema: JSON_SCHEMA },
        }
      : { type: "json_object" },
  });

  const content = completion.choices[0]?.message?.content;
  if (!content) {
    throw new Error("AI診断の生成に失敗しました（応答が空でした）");
  }

  let raw: unknown;
  try {
    raw = JSON.parse(stripThinking(content));
  } catch {
    throw new Error("AI診断の生成に失敗しました（応答を解析できませんでした）");
  }

  const result = DiagnosisSchema.parse(raw);
  return { ...result, model };
}

import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { z } from "zod";
import type { SubMetric } from "@/lib/webdock";

// 安価・高速なモデル（構造化出力に対応）
const MODEL = "claude-haiku-4-5";

export const DiagnosisSchema = z.object({
  summary: z.string().describe("全体の所見を1〜2文で（日本語）"),
  goodPoints: z.array(z.string()).describe("良い点（0〜3個、日本語）"),
  improvePoints: z.array(z.string()).describe("改善点（0〜3個、日本語）"),
  actions: z
    .array(
      z.object({
        text: z.string().describe("具体的なアクション（日本語）"),
        priority: z.enum(["high", "mid", "low"]),
      }),
    )
    .describe("おすすめアクション（0〜3個）"),
});

export type Diagnosis = z.infer<typeof DiagnosisSchema>;
export interface DiagnosisResult extends Diagnosis {
  model: string;
}

export function hasAnthropicKey(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY);
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
  const client = new Anthropic(); // ANTHROPIC_API_KEY を環境から解決

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

上記をもとに、この企業向けの診断（summary / goodPoints / improvePoints / actions）を作成してください。`;

  const message = await client.messages.parse({
    model: MODEL,
    max_tokens: 1024,
    system: SYSTEM,
    messages: [{ role: "user", content: userText }],
    output_config: { format: zodOutputFormat(DiagnosisSchema) },
  });

  const parsed = message.parsed_output;
  if (!parsed) {
    throw new Error("AI診断の生成に失敗しました（出力を解析できませんでした）");
  }

  return { ...parsed, model: MODEL };
}

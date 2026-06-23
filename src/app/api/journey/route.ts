import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { buildMarketingContext } from "@/lib/ai/chat";
import {
  createAIClient,
  getProvider,
  stripThinking,
} from "@/lib/ai/provider";
import {
  JOURNEY_STAGE_ORDER,
  JourneyPlanSchema,
} from "@/lib/customer-journey";

export const maxDuration = 120;

const RequestSchema = z.object({
  productName: z.string().min(1).max(120),
  description: z.string().min(1).max(2000),
  targetCustomer: z.string().max(600).default(""),
  price: z.string().max(100).default(""),
  url: z.union([z.string().url(), z.literal("")]).default(""),
});

const OUTPUT_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    productSummary: { type: "string" },
    targetCustomer: { type: "string" },
    positioning: { type: "string" },
    stages: {
      type: "array",
      minItems: 7,
      maxItems: 7,
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          key: {
            type: "string",
            enum: JOURNEY_STAGE_ORDER,
          },
          name: { type: "string" },
          story: { type: "string" },
          actions: { type: "array", items: { type: "string" } },
          thoughts: { type: "array", items: { type: "string" } },
          hurdles: { type: "array", items: { type: "string" } },
          measures: { type: "array", items: { type: "string" } },
        },
        required: [
          "key",
          "name",
          "story",
          "actions",
          "thoughts",
          "hurdles",
          "measures",
        ],
      },
    },
    sources: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          title: { type: "string" },
          url: { type: "string" },
        },
        required: ["title", "url"],
      },
    },
    researched: { type: "boolean" },
  },
  required: [
    "productSummary",
    "targetCustomer",
    "positioning",
    "stages",
    "sources",
    "researched",
  ],
} as const;

const SYSTEM = `あなたは中小企業の商品・サービスの集客設計を行うマーケティングストラテジストです。
商品情報、会社情報、市場リサーチをもとに、顧客が認知からファンになるまでのカスタマージャーニーを設計してください。

必須要件:
- stages は awareness, interest, action, comparison, purchase, usage, loyalty の順で必ず7件
- 各段階に「顧客の物語」「行動」「心理」「ハードル」「施策」を具体的に記述
- 非専門家が読んで、そのまま施策を考えられる平易な日本語
- 入力にない事実や数値を断定しない
- ハードルは売り手側の改善課題として書く
- measures は今日から実行できる具体策にする
- 調査情報は参考に留め、商品の固有情報を勝手に作らない
- JSON以外は出力しない`;

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return Response.json({ error: "ログインが必要です。" }, { status: 401 });
  }

  let input: z.infer<typeof RequestSchema>;
  try {
    input = RequestSchema.parse(await request.json());
  } catch {
    return Response.json(
      { error: "商品名と商品の説明を入力してください。" },
      { status: 400 },
    );
  }

  const companyContext = await buildMarketingContext();
  const { client, model, supportsStrictJson } = createAIClient();
  let research = "";
  let sources: { title: string; url: string }[] = [];
  let researched = false;

  if (getProvider() === "openai") {
    try {
      const researchResponse = await client.responses.create({
        model: process.env.OPENAI_RESEARCH_MODEL ?? "gpt-4.1-mini",
        tools: [{ type: "web_search" }],
        tool_choice: "required",
        input: `次の商品・サービスについて、日本市場での顧客ニーズ、比較時の判断材料、購入障壁、利用後の継続・口コミ要因を調査してください。
推測と確認できた情報を区別し、集客設計に使える要点だけを日本語でまとめてください。

商品名: ${input.productName}
説明: ${input.description}
想定顧客: ${input.targetCustomer || "未指定"}
価格: ${input.price || "未指定"}
公式URL: ${input.url || "未指定"}`,
      });
      research = researchResponse.output_text;
      const seen = new Set<string>();
      for (const item of researchResponse.output) {
        if (item.type !== "message") continue;
        for (const part of item.content) {
          if (part.type !== "output_text") continue;
          for (const annotation of part.annotations) {
            if (annotation.type !== "url_citation") continue;
            if (seen.has(annotation.url)) continue;
            seen.add(annotation.url);
            sources.push({ title: annotation.title, url: annotation.url });
          }
        }
      }
      sources = sources.slice(0, 8);
      researched = true;
    } catch (error) {
      console.error("journey web research error", error);
    }
  }

  const userPrompt = `# 商品
商品名: ${input.productName}
説明: ${input.description}
想定顧客: ${input.targetCustomer || "未指定。情報から仮説を立てる"}
価格: ${input.price || "未指定"}
公式URL: ${input.url || "未指定"}

# 会社の既存データ
${companyContext}

# Webリサーチ
${research || "Web検索は利用していません。入力情報と会社データの範囲で仮説として設計してください。"}

7段階の集客設計をJSONで作成してください。
sources は次の出典だけを使用してください: ${JSON.stringify(sources)}
researched は ${researched} にしてください。`;

  try {
    const completion = await client.chat.completions.create({
      model,
      messages: [
        { role: "system", content: SYSTEM },
        { role: "user", content: userPrompt },
      ],
      response_format: supportsStrictJson
        ? {
            type: "json_schema",
            json_schema: {
              name: "customer_journey",
              strict: true,
              schema: OUTPUT_SCHEMA,
            },
          }
        : { type: "json_object" },
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) throw new Error("AIの応答が空です");
    const raw = JSON.parse(stripThinking(content)) as Record<string, unknown>;
    raw.sources = sources;
    raw.researched = researched;
    const parsed = JourneyPlanSchema.parse(raw);
    return Response.json(parsed);
  } catch (error) {
    console.error("journey generation error", error);
    return Response.json(
      {
        error:
          "集客設計の生成に失敗しました。入力内容を少し具体的にして、もう一度お試しください。",
      },
      { status: 502 },
    );
  }
}


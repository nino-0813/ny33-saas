import "server-only";
import { createAIClient } from "@/lib/ai/provider";
import { getDashboardData } from "@/lib/queries";
import { getLiveMetrics } from "@/lib/live-metrics";

export type ChatRole = "user" | "assistant";
export interface ChatMessage {
  role: ChatRole;
  content: string;
}

const SYSTEM = `あなたは中小企業のWeb集客を伴走支援する、やさしいプロのWebマーケターです。
ユーザー（多くは非エンジニアの店舗・中小企業オーナー）が、毎日5分このアプリを開くだけで
「次に何をすればよいか」が分かるように手助けします。

ふるまい:
- 専門用語は避け、使うときは一言で補足する
- 必ず具体的で実行可能な提案をする（「SEOを頑張る」ではなく「〇〇のページを今週作る」）
- 提供された会社のデータ（SEO・アクセス等）の範囲で答え、数値を捏造しない
- 回答は簡潔に。要点 → 具体アクションの順。箇条書きを活用する
- 日本語で、励ましつつ前向きに

/no_think`;

/** ログインユーザーの会社データを、AIに渡す文脈テキストへ整形する */
export async function buildMarketingContext(): Promise<string> {
  const [data, live] = await Promise.all([getDashboardData(), getLiveMetrics()]);
  if (!data) {
    return "（まだ会社データが連携されていません。一般的なWeb集客の知見で回答してください。）";
  }

  // GA4 / Search Console の実数値（連携済みなら最優先で根拠にする）
  let realData = "";
  if (live.connected) {
    const parts: string[] = [];
    if (live.ga4) {
      parts.push(
        `- アクセス(GA4・当月): PV ${live.ga4.pv.toLocaleString()} / ユーザー ${live.ga4.uu.toLocaleString()} / CV ${live.ga4.cv.toLocaleString()}`,
      );
    }
    if (live.gsc) {
      parts.push(
        `- 検索(Search Console・直近28日): 平均掲載順位 ${live.gsc.position.toFixed(1)}位 / CTR ${live.gsc.ctr}% / クリック ${live.gsc.clicks.toLocaleString()} / 表示 ${live.gsc.impressions.toLocaleString()}`,
      );
    }
    if (live.ga4 && live.ga4.cv === 0) {
      parts.push("- 注記: GA4にコンバージョン(キーイベント)が未設定のため、CVは0として記録されています。");
    }
    if (parts.length) realData = `\n\n# 実測データ（GA4 / Search Console）\n${parts.join("\n")}`;
  }

  const kpis = data.kpis
    .map((k) => `- ${k.label}: ${k.value}${k.unit ?? ""}（前回比 ${k.deltaLabel}）`)
    .join("\n");

  const issues = data.aiIssues
    .slice(0, 5)
    .map((i) => `- [優先度${i.priority}] ${i.title}: ${i.detail}`)
    .join("\n");

  const desc = data.company.description
    ? `\n事業内容: ${data.company.description}`
    : "";

  return `# 会社
${data.company.name}（業種: ${data.company.industry || "不明"} / エリア: ${data.company.area || "不明"}）${desc}

# Web健康スコア
${data.health.score}/100（前回 ${data.health.prevScore}）

# 主要KPI
${kpis || "（データなし）"}

# AIが検知している課題
${issues || "（特になし）"}${realData}`;
}

/**
 * 集客チャットの応答をストリーミングで返す。
 * OpenAI / Ollama 共通（Ollama は OpenAI 互換 /v1 経由）。
 */
export async function streamChat(
  messages: ChatMessage[],
  context: string,
): Promise<ReadableStream<Uint8Array>> {
  const { client, model } = createAIClient();

  const stream = await client.chat.completions.create({
    model,
    stream: true,
    messages: [
      { role: "system", content: SYSTEM },
      {
        role: "system",
        content: `以下は相談相手の会社の最新データです。これを踏まえて回答してください。\n\n${context}`,
      },
      ...messages.map((m) => ({ role: m.role, content: m.content })),
    ],
  });

  const encoder = new TextEncoder();
  let inThink = false; // <think> ブロックを除去しながら流す

  return new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of stream) {
          let text = chunk.choices[0]?.delta?.content ?? "";
          if (!text) continue;

          // 思考ブロックを跨いで除去（チャンク境界はおおむね安全側に処理）
          if (inThink) {
            const end = text.indexOf("</think>");
            if (end === -1) continue;
            text = text.slice(end + "</think>".length);
            inThink = false;
          }
          const start = text.indexOf("<think>");
          if (start !== -1) {
            const before = text.slice(0, start);
            inThink = true;
            text = before;
          }
          if (text) controller.enqueue(encoder.encode(text));
        }
      } catch (error) {
        controller.enqueue(
          encoder.encode(
            "\n\n（AIサーバーに接続できませんでした。設定をご確認ください。）",
          ),
        );
        console.error("streamChat error", error);
      } finally {
        controller.close();
      }
    },
  });
}

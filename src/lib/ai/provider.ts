import "server-only";
import OpenAI from "openai";

/**
 * AIプロバイダ抽象化層。
 * Ollama は OpenAI 互換エンドポイント（/v1）を持つため、openai SDK の baseURL を差し替えるだけで
 * OpenAI / ローカルLLM（Ollama + Qwen3 など）を同一コードで扱える。
 *
 * env:
 *   AI_PROVIDER       openai | ollama | gemini（未指定なら OPENAI_API_KEY の有無で自動判定）
 *   OLLAMA_BASE_URL   例: http://127.0.0.1:11434 / https://xxxxx-11434.proxy.runpod.net
 *   OLLAMA_MODEL      例: qwen3:8b
 *   AI_SERVER_SECRET  自分のAPI→RunPod を守るための認証キー（前段で検証する）
 *   OPENAI_API_KEY / OPENAI_MODEL
 *   GEMINI_API_KEY / GEMINI_MODEL  例: gemini-2.5-flash（OpenAI互換 /v1beta/openai 経由）
 */
export type AIProvider = "openai" | "ollama" | "gemini";

export function getProvider(): AIProvider {
  const explicit = process.env.AI_PROVIDER?.toLowerCase();
  if (explicit === "ollama" || explicit === "openai" || explicit === "gemini") {
    return explicit;
  }
  if (process.env.OPENAI_API_KEY) return "openai";
  if (process.env.GEMINI_API_KEY) return "gemini";
  return "ollama";
}

/** AI が利用可能か（キー/接続先が設定されているか） */
export function hasAI(): boolean {
  const p = getProvider();
  if (p === "openai") return Boolean(process.env.OPENAI_API_KEY);
  if (p === "gemini") return Boolean(process.env.GEMINI_API_KEY);
  return Boolean(process.env.OLLAMA_BASE_URL ?? "http://127.0.0.1:11434");
}

export interface AIClient {
  client: OpenAI;
  model: string;
  provider: AIProvider;
  /** strict json_schema を使えるか。false の場合は json_object + zod 検証で対応する。 */
  supportsStrictJson: boolean;
}

export function createAIClient(): AIClient {
  const provider = getProvider();

  if (provider === "gemini") {
    return {
      client: new OpenAI({
        baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/",
        apiKey: process.env.GEMINI_API_KEY,
      }),
      model: process.env.GEMINI_MODEL ?? "gemini-2.5-flash",
      provider,
      supportsStrictJson: false, // json_object + zod 検証で扱う
    };
  }

  if (provider === "ollama") {
    const baseURL = (
      process.env.OLLAMA_BASE_URL ?? "http://127.0.0.1:11434"
    ).replace(/\/$/, "");
    return {
      client: new OpenAI({
        baseURL: `${baseURL}/v1`,
        // Ollama 自体は鍵を見ないが、前段（自分のAPI/RunPod）で検証する想定。
        apiKey: process.env.AI_SERVER_SECRET || "ollama",
      }),
      model: process.env.OLLAMA_MODEL ?? "qwen3:8b",
      provider,
      supportsStrictJson: false,
    };
  }

  return {
    client: new OpenAI(), // OPENAI_API_KEY を環境から解決
    model: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
    provider,
    supportsStrictJson: true,
  };
}

/** qwen3 等の思考モデルが出力する <think>…</think> ブロックを除去する。 */
export function stripThinking(text: string): string {
  return text.replace(/<think>[\s\S]*?<\/think>/g, "").trimStart();
}

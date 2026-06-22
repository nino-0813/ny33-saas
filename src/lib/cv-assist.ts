import type { Ga4Event } from "@/lib/google/ga4";

export type CvTier = "primary" | "secondary";

export interface CvSuggestion {
  event: string;
  label: string;
  tier: CvTier;
  count: number;
}

export interface CvAssist {
  /** キーイベント化を推奨するイベント（成果に近い順） */
  suggestions: CvSuggestion[];
  /** EC的イベントはあるのに purchase が無い＝購入計測が未導入の疑い */
  missingPurchase: boolean;
}

/**
 * GA4 のイベント名 → 「CV（成果）として測る価値があるか」のカタログ。
 * 業種横断で使えるよう、購入・問い合わせ・予約・会員登録などを広くカバーする。
 */
const CATALOG: Record<string, { label: string; tier: CvTier }> = {
  // 最重要（=売上・問い合わせに直結）
  purchase: { label: "購入完了", tier: "primary" },
  generate_lead: { label: "問い合わせ・リード獲得", tier: "primary" },
  form_submit: { label: "フォーム送信", tier: "primary" },
  contact: { label: "問い合わせ", tier: "primary" },
  sign_up: { label: "会員登録", tier: "primary" },
  reservation: { label: "予約完了", tier: "primary" },
  booking: { label: "予約完了", tier: "primary" },
  // 有力（成果の一歩手前。今すぐ測れる）
  begin_checkout: { label: "購入手続き開始", tier: "secondary" },
  add_to_cart: { label: "カート追加", tier: "secondary" },
  form_start: { label: "フォーム入力開始", tier: "secondary" },
  add_payment_info: { label: "支払い情報入力", tier: "secondary" },
  add_shipping_info: { label: "配送情報入力", tier: "secondary" },
};

const EC_INTENT = new Set([
  "add_to_cart",
  "begin_checkout",
  "view_cart",
  "add_payment_info",
  "add_shipping_info",
]);

/** 発生イベントから、キーイベント化を推奨する候補を抽出する */
export function suggestKeyEvents(events: Ga4Event[]): CvAssist {
  const present = new Map(events.map((e) => [e.name, e.count]));

  const suggestions: CvSuggestion[] = events
    .filter((e) => CATALOG[e.name] && e.count > 0)
    .map((e) => ({
      event: e.name,
      label: CATALOG[e.name].label,
      tier: CATALOG[e.name].tier,
      count: e.count,
    }))
    .sort((a, b) => {
      if (a.tier !== b.tier) return a.tier === "primary" ? -1 : 1;
      return b.count - a.count;
    });

  const missingPurchase =
    !present.has("purchase") &&
    [...EC_INTENT].some((name) => (present.get(name) ?? 0) > 0);

  return { suggestions, missingPurchase };
}

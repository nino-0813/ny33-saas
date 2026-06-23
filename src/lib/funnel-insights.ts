import type { FunnelSignals } from "@/lib/funnel-data";

export const FUNNEL_KEYS = [
  "awareness",
  "interest",
  "action",
  "comparison",
  "purchase",
  "usage",
  "loyalty",
] as const;

export type FunnelKey = (typeof FUNNEL_KEYS)[number];

export interface FunnelInsight {
  key: FunnelKey;
  name: string;
  question: string;
  summary: string;
  source: string;
  target: string;
  actual: string;
  formula: string;
  interpretation: string;
  actions: { title: string; detail: string }[];
  resources: { title: string; source: string; date?: string; href: string }[];
}

export interface FunnelChatFocus {
  key: FunnelKey;
  name: string;
  score: number;
  actual: string;
  target: string;
  interpretation: string;
  questions: string[];
}

export function isFunnelKey(value: string): value is FunnelKey {
  return FUNNEL_KEYS.includes(value as FunnelKey);
}

const pct = (value: number) => `${(value * 100).toFixed(1)}%`;
const num = (value: number) => value.toLocaleString("ja-JP");

export function getFunnelInsight(
  key: FunnelKey,
  signals?: FunnelSignals,
): FunnelInsight {
  const s: FunnelSignals = signals ?? {
    impressions: 0,
    ctr: 0,
    sessions: 0,
    totalUsers: 0,
    newUsers: 0,
    engagedSessions: 0,
    keyEvents: 0,
    viewItem: 0,
    beginCheckout: 0,
    purchase: 0,
    hasPurchaseEvent: false,
  };
  const returning = Math.max(0, s.totalUsers - s.newUsers);
  const returnRatio = s.totalUsers > 0 ? returning / s.totalUsers : 0;
  const engagementRate = s.sessions > 0 ? s.engagedSessions / s.sessions : 0;
  const itemViewRate = s.sessions > 0 ? s.viewItem / s.sessions : 0;
  const conversions = s.purchase || s.keyEvents;
  const checkoutRate =
    s.beginCheckout > 0 ? conversions / s.beginCheckout : 0;

  const commonNews = {
    title: "Google Marketing Live 2026：計測と意思決定の最新動向",
    source: "Google",
    date: "2026年5月",
    href: "https://blog.google/products/ads-commerce/google-marketing-live-2026-turn-your-data-into-decisions/",
  };

  const insights: Record<FunnelKey, FunnelInsight> = {
    awareness: {
      key,
      name: "認知",
      question: "検索結果でどれだけ見つけてもらえているか",
      summary: "Search Consoleの検索表示回数を、直近28日で1,500回という目安と比較します。",
      source: "Google Search Console・直近28日",
      target: "検索表示 1,500回",
      actual: `検索表示 ${num(s.impressions)}回`,
      formula: `${num(s.impressions)} ÷ 1,500`,
      interpretation:
        s.impressions >= 1500
          ? "検索面で十分な露出があります。次はクリックされる見せ方を改善する段階です。"
          : "検索結果に現れる回数が不足しています。検索意図に合うページを増やす余地があります。",
      actions: [
        { title: "検索クエリを確認", detail: "表示はあるが順位が低いテーマから、既存ページを改善します。" },
        { title: "専門ページを増やす", detail: "顧客の具体的な悩みごとに、1テーマ1ページで情報を用意します。" },
      ],
      resources: [
        {
          title: "Google Search Centralの最新アップデート",
          source: "Google Search Central",
          href: "https://developers.google.com/search/blog",
        },
        {
          title: "2026年2月 Discoverコアアップデート",
          source: "Google Search Central",
          date: "2026年2月",
          href: "https://developers.google.com/search/blog/2026/02/discover-core-update",
        },
      ],
    },
    interest: {
      key,
      name: "興味",
      question: "検索結果を見た人がサイトを選んでいるか",
      summary: "Search Consoleのクリック率（CTR）を、業種横断の目安6%と比較します。",
      source: "Google Search Console・直近28日",
      target: "CTR 6.0%",
      actual: `CTR ${pct(s.ctr)}`,
      formula: `${pct(s.ctr)} ÷ 6.0%`,
      interpretation:
        s.ctr >= 0.06
          ? "検索結果で十分に選ばれています。流入後の体験改善に進めます。"
          : "表示はされてもクリックに至っていません。タイトルと説明文の改善が有効です。",
      actions: [
        { title: "タイトルを具体化", detail: "誰の、どんな悩みを、どう解決するページかを明確にします。" },
        { title: "検索意図と内容を一致", detail: "検索結果で約束した情報を、ページ冒頭ですぐ提示します。" },
      ],
      resources: [
        {
          title: "検索に役立つコンテンツを作る基本",
          source: "Google Search Central",
          href: "https://developers.google.com/search/docs/fundamentals/creating-helpful-content",
        },
        commonNews,
      ],
    },
    action: {
      key,
      name: "行動",
      question: "訪問した人がサイト内で意味のある行動をしたか",
      summary: "GA4のエンゲージセッション率を、目安55%と比較します。",
      source: "Google Analytics・直近28日",
      target: "エンゲージ率 55.0%",
      actual: `${num(s.engagedSessions)} / ${num(s.sessions)}セッション（${pct(engagementRate)}）`,
      formula: `${pct(engagementRate)} ÷ 55.0%`,
      interpretation:
        engagementRate >= 0.55
          ? "訪問後の反応は良好です。商品・サービス比較への導線を強めましょう。"
          : "短時間で離脱する訪問が多い状態です。ファーストビューと表示速度を見直します。",
      actions: [
        { title: "最初の画面を整理", detail: "価値、対象者、次の行動をスクロール前に伝えます。" },
        { title: "主要導線を一本化", detail: "ページごとに最も重要なCTAを一つに絞ります。" },
      ],
      resources: [
        {
          title: "GA4のエンゲージメント率の定義",
          source: "Google Analytics Help",
          href: "https://support.google.com/analytics/answer/12195621?hl=ja",
        },
        {
          title: "拡張計測イベントの活用",
          source: "Google Analytics Help",
          href: "https://support.google.com/analytics/answer/9216061?hl=ja",
        },
      ],
    },
    comparison: {
      key,
      name: "比較",
      question: "商品やサービスを具体的に検討しているか",
      summary: "商品詳細閲覧イベント（view_item）をセッション数で割り、目安35%と比較します。",
      source: "Google Analytics・直近28日",
      target: "商品閲覧率 35.0%",
      actual: `${num(s.viewItem)}回 / ${num(s.sessions)}セッション（${pct(itemViewRate)}）`,
      formula: `${pct(itemViewRate)} ÷ 35.0%`,
      interpretation:
        itemViewRate >= 0.35
          ? "比較検討につながっています。購入前の不安を減らす情報が次の焦点です。"
          : "訪問から商品・サービス詳細へ進めていません。案内導線や情報構造を改善します。",
      actions: [
        { title: "比較材料を揃える", detail: "料金、対象者、違い、導入事例を同じ画面で確認できるようにします。" },
        { title: "詳細ページへの導線", detail: "人気商品や代表サービスをトップページから直接案内します。" },
      ],
      resources: [
        {
          title: "GA4で推奨されるイベント",
          source: "Google Analytics Help",
          href: "https://support.google.com/analytics/answer/9267735?hl=ja",
        },
        commonNews,
      ],
    },
    purchase: {
      key,
      name: "購買",
      question: "購入手続きを始めた人が成果まで到達したか",
      summary: "購入手続き開始からpurchaseまたはキーイベントへの到達率を、目安40%と比較します。",
      source: "Google Analytics・直近28日",
      target: "手続き完了率 40.0%",
      actual: `${num(conversions)}件 / 手続き開始 ${num(s.beginCheckout)}件（${pct(checkoutRate)}）`,
      formula:
        s.beginCheckout > 0
          ? `${pct(checkoutRate)} ÷ 40.0%`
          : "手続き開始イベントがないため、セッション比で評価",
      interpretation:
        !s.hasPurchaseEvent && s.keyEvents === 0
          ? "購入完了を正しく計測できていない可能性があります。改善前に計測設定を確認してください。"
          : checkoutRate >= 0.4
            ? "購入完了までの流れは良好です。流入量と比較検討者を増やす段階です。"
            : "購入手続き中の離脱が多い状態です。入力負荷、費用表示、決済方法を確認します。",
      actions: [
        { title: "計測を最初に確認", detail: "purchaseとbegin_checkoutが実際の完了・開始時に発火するか確認します。" },
        { title: "購入時の不安を減らす", detail: "送料、納期、返品、支払方法を手続き前に明示します。" },
      ],
      resources: [
        {
          title: "GA4のEC購入レポート",
          source: "Google Analytics Help",
          href: "https://support.google.com/analytics/answer/12924131?hl=ja",
        },
        {
          title: "オンライン販売向け推奨イベント",
          source: "Google Analytics Help",
          href: "https://support.google.com/analytics/answer/9267735?hl=ja",
        },
      ],
    },
    usage: {
      key,
      name: "利用",
      question: "一度訪れた人が再び利用しているか",
      summary: "全ユーザーに占めるリピーターの割合を、目安20%と比較します。",
      source: "Google Analytics・直近28日",
      target: "リピート率 20.0%",
      actual: `${num(returning)}人 / ${num(s.totalUsers)}人（${pct(returnRatio)}）`,
      formula: `${pct(returnRatio)} ÷ 20.0%`,
      interpretation:
        returnRatio >= 0.2
          ? "再訪が生まれています。継続利用を促す接点を強化できます。"
          : "一度きりの訪問が多い状態です。再訪理由とフォロー接点を設計します。",
      actions: [
        { title: "再訪理由を作る", detail: "更新情報、事例、チェックリストなど定期的に見る価値を用意します。" },
        { title: "フォロー導線を追加", detail: "メール、LINE、SNSなど顧客に合う継続接点へ案内します。" },
      ],
      resources: [
        {
          title: "GA4エンゲージメント概要レポート",
          source: "Google Analytics Help",
          href: "https://support.google.com/analytics/answer/13391283?hl=ja",
        },
        commonNews,
      ],
    },
    loyalty: {
      key,
      name: "愛情",
      question: "繰り返し選ばれるファンが育っているか",
      summary: "現在はリピーター率を代理指標として、ファン化の目安35%と比較します。",
      source: "Google Analytics・直近28日",
      target: "リピート率 35.0%",
      actual: `${num(returning)}人 / ${num(s.totalUsers)}人（${pct(returnRatio)}）`,
      formula: `${pct(returnRatio)} ÷ 35.0%`,
      interpretation:
        returnRatio >= 0.35
          ? "強い再訪行動があります。口コミや紹介につながる仕組みを検討できます。"
          : "ファン化はこれからです。満足度や紹介を直接測るデータも追加すると精度が上がります。",
      actions: [
        { title: "ファン指標を追加", detail: "口コミ、紹介、LINE継続率、再購入を計測対象に加えます。" },
        { title: "成功体験を共有", detail: "利用後の成果を事例化し、顧客同士で共有できる場を作ります。" },
      ],
      resources: [
        {
          title: "顧客行動を理解するGA4指標一覧",
          source: "Google Analytics Help",
          href: "https://support.google.com/analytics/table/13948007?hl=ja",
        },
        commonNews,
      ],
    },
  };

  return insights[key];
}

export function getFunnelChatQuestions(key: FunnelKey): string[] {
  const questions: Record<FunnelKey, string[]> = {
    awareness: [
      "検索表示を増やすために、最初に改善すべきページはどれですか？",
      "狙うべき検索キーワードを優先順位付きで教えてください",
      "今あるページを使って認知を増やす具体的な方法は？",
      "今週できる認知改善の作業を3つに絞ってください",
    ],
    interest: [
      "クリック率が低い原因を、今のデータから説明してください",
      "検索タイトルと説明文をどう直せば選ばれやすくなりますか？",
      "クリック率を上げやすいページを優先順位付きで教えてください",
      "改善効果を確認するために、何をどう測ればいいですか？",
    ],
    action: [
      "訪問後に離脱されている原因を、今の数値から考えてください",
      "ファーストビューで最初に直すべき内容は何ですか？",
      "問い合わせや詳細ページへ進みやすい導線を提案してください",
      "今週できる行動率改善を3つに絞ってください",
    ],
    comparison: [
      "商品・サービス詳細へ進まない原因を整理してください",
      "比較検討に必要な情報で、今のサイトに足りないものは？",
      "料金・事例・違いをどの順番で見せるべきですか？",
      "商品閲覧率を上げるためのページ構成を提案してください",
    ],
    purchase: [
      "購入や問い合わせ完了までの離脱原因を整理してください",
      "購入計測が正しく設定されているか確認する手順を教えてください",
      "購入前の不安を減らすために追加すべき情報は何ですか？",
      "完了率を上げる施策を効果が高い順に教えてください",
    ],
    usage: [
      "リピーターが少ない原因を、今の状態から考えてください",
      "再訪してもらうために提供すべきコンテンツは何ですか？",
      "メール・LINE・SNSのどれを優先すべきですか？",
      "リピート率改善のための30日プランを作ってください",
    ],
    loyalty: [
      "ファン化を測るために追加すべき指標を教えてください",
      "口コミや紹介を増やす具体的な仕組みを提案してください",
      "既存顧客との関係を深めるコンテンツ案を出してください",
      "ファン化施策を小さく始める30日プランを作ってください",
    ],
  };

  return questions[key];
}

export function buildFunnelChatFocus(
  key: FunnelKey,
  score: number,
  signals?: FunnelSignals,
): FunnelChatFocus {
  const insight = getFunnelInsight(key, signals);
  return {
    key,
    name: insight.name,
    score,
    actual: insight.actual,
    target: insight.target,
    interpretation: insight.interpretation,
    questions: getFunnelChatQuestions(key),
  };
}

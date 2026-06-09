/**
 * Webドック ダッシュボードのサンプルデータ（当面はモック）
 * 実データ連携が完了したら順次置き換える。
 */

export type CheckStatus = "ok" | "warn" | "bad";
export type CheckIcon =
  | "access"
  | "seo"
  | "gbp"
  | "sns"
  | "speed"
  | "mobile"
  | "security"
  | "content"
  | "competitor"
  | "anomaly";

export interface WebCheck {
  id: string;
  icon: CheckIcon;
  name: string;
  subtitle: string;
  score: number; // 0-100
  status: CheckStatus;
  delta: number; // 前回比（+/-、0=変化なし）
  lastCheck: string;
}

const LAST = "6/8 18:48";

export const webChecks: WebCheck[] = [
  { id: "access", icon: "access", name: "アクセス・集客状況チェック", subtitle: "アクセス数・流入元・問い合わせ数を診断", score: 85, status: "ok", delta: 5, lastCheck: LAST },
  { id: "seo", icon: "seo", name: "SEO検索パフォーマンスチェック", subtitle: "検索順位・表示回数・クリック率を診断", score: 88, status: "ok", delta: 8, lastCheck: LAST },
  { id: "gbp", icon: "gbp", name: "Googleビジネスプロフィールチェック", subtitle: "クチコミ・評価・投稿・表示状況を診断", score: 70, status: "warn", delta: -5, lastCheck: LAST },
  { id: "sns", icon: "sns", name: "SNSパフォーマンスチェック", subtitle: "フォロワー・エンゲージメント・投稿頻度を診断", score: 80, status: "ok", delta: 3, lastCheck: LAST },
  { id: "speed", icon: "speed", name: "サイト表示速度チェック", subtitle: "ページの表示速度・モバイル最適化を診断", score: 90, status: "ok", delta: 2, lastCheck: LAST },
  { id: "mobile", icon: "mobile", name: "モバイルユーザビリティチェック", subtitle: "スマホでの見やすさ・操作性を診断", score: 85, status: "ok", delta: 0, lastCheck: LAST },
  { id: "security", icon: "security", name: "セキュリティ・SSLチェック", subtitle: "SSL設定・脆弱性・安全性を診断", score: 95, status: "ok", delta: 5, lastCheck: LAST },
  { id: "content", icon: "content", name: "コンテンツ最適化チェック", subtitle: "コンテンツ量・更新頻度・品質を診断", score: 65, status: "warn", delta: -10, lastCheck: LAST },
  { id: "competitor", icon: "competitor", name: "競合サイト比較チェック", subtitle: "競合との比較・強み弱みを診断", score: 75, status: "ok", delta: 4, lastCheck: LAST },
  { id: "anomaly", icon: "anomaly", name: "Web異常検知チェック", subtitle: "アクセス急減・エラー・異常を自動検知", score: 100, status: "ok", delta: 0, lastCheck: LAST },
];

export interface SummaryStats {
  healthScore: number;
  scoreLabel: string;
  scoreDelta: number;
  totalDetections: number;
  totalDetectionsDelta: number;
  monthlyChecks: number;
  monthlyChecksDelta: number;
  needsAction: number;
  needsActionDelta: number;
  allNormal: number;
  allNormalDelta: number;
  lastCheckedAt: string;
}

export const summary: SummaryStats = {
  healthScore: 82,
  scoreLabel: "良好",
  scoreDelta: 5,
  totalDetections: 26,
  totalDetectionsDelta: 4,
  monthlyChecks: 26,
  monthlyChecksDelta: 2,
  needsAction: 2,
  needsActionDelta: -1,
  allNormal: 8,
  allNormalDelta: 1,
  lastCheckedAt: "2026年6月8日 18:48",
};

/** スコア推移（30日間） */
export interface TrendPoint {
  label: string; // 日付ラベル
  score: number;
}

export const scoreTrend: TrendPoint[] = [
  { label: "5/10", score: 66 },
  { label: "5/13", score: 78 },
  { label: "5/17", score: 71 },
  { label: "5/20", score: 73 },
  { label: "5/24", score: 80 },
  { label: "5/27", score: 76 },
  { label: "5/31", score: 78 },
  { label: "6/3", score: 80 },
  { label: "6/8", score: 82 },
];

export type Priority = "high" | "mid" | "low";

export interface PriorityTask {
  rank: number;
  text: string;
  priority: Priority;
}

export const priorityTasks: PriorityTask[] = [
  { rank: 1, text: "Googleビジネスのクチコミに返信しましょう", priority: "high" },
  { rank: 2, text: "最新の施工事例を1件追加しましょう", priority: "mid" },
  { rank: 3, text: "Googleビジネスに最新情報を投稿しましょう", priority: "mid" },
  { rank: 4, text: "サイトの表示速度を改善しましょう", priority: "low" },
];

export type NewsTag = "new" | "feature" | "info";

export interface NewsItem {
  tag: NewsTag;
  date: string;
  title: string;
}

export const newsItems: NewsItem[] = [
  { tag: "new", date: "2026/06/08", title: "新生活狙いの詐欺増加 銀行の偽サイトにも注意！" },
  { tag: "feature", date: "2026/06/05", title: "レポート機能が新しくなりました" },
  { tag: "info", date: "2026/06/01", title: "Webドックメンテナンスのお知らせ（6/10）" },
];

/* ============================================================
 * チェック詳細（各チェックページ用・サンプル）
 * ========================================================== */

export interface SubMetric {
  label: string;
  value: string;
  sub?: string;
  /** 目安（基準値）。例: "2.5秒以内" */
  target?: string;
  /** 目安に対する判定（ok=良好 / warn=注意 / bad=要対応）。未指定なら判定なし */
  judge?: CheckStatus;
}

export interface CheckDetailContent {
  summary: string;
  subMetrics: SubMetric[];
  goodPoints: string[];
  improvePoints: string[];
  actions: { text: string; priority: Priority }[];
}

export const checkDetails: Record<string, CheckDetailContent> = {
  access: {
    summary: "アクセス数は堅調に推移。流入チャネルのバランスも良好です。",
    subMetrics: [
      { label: "ページビュー", value: "18,420", sub: "前月比 +8%", target: "前月比プラス", judge: "ok" },
      { label: "ユーザー数", value: "9,310", sub: "前月比 +6%", target: "前月比プラス", judge: "ok" },
      { label: "問い合わせ数", value: "34", sub: "件 / 月", target: "月20件以上", judge: "ok" },
      { label: "直帰率", value: "42%", sub: "低いほど良い", target: "60%以下", judge: "ok" },
    ],
    goodPoints: ["前月比でアクセスが増加しています", "オーガニック流入が安定しています"],
    improvePoints: ["SNSからの流入が少なめです"],
    actions: [{ text: "SNS投稿を増やして流入を強化しましょう", priority: "mid" }],
  },
  seo: {
    summary: "主要キーワードの順位が改善。検索流入は上向きです。",
    subMetrics: [
      { label: "平均検索順位", value: "12.4", sub: "位（低いほど良い）", target: "10位以内", judge: "warn" },
      { label: "表示回数", value: "51,200", sub: "回 / 月" },
      { label: "クリック率", value: "3.8%", sub: "平均以上", target: "3%以上", judge: "ok" },
      { label: "上位表示KW", value: "28", sub: "語（10位以内）", target: "増加が目安", judge: "ok" },
    ],
    goodPoints: ["「尾道 注文住宅」の順位が上昇", "クリック率が業界平均を上回る"],
    improvePoints: ["1ページ目に未到達のキーワードがあります"],
    actions: [
      { text: "施工事例ページを5本追加しましょう", priority: "high" },
      { text: "関連ページへの内部リンクを整理しましょう", priority: "mid" },
    ],
  },
  gbp: {
    summary: "クチコミ対応の遅れが評価・表示に影響しています。",
    subMetrics: [
      { label: "クチコミ数", value: "48", sub: "件", target: "50件以上", judge: "warn" },
      { label: "平均評価", value: "4.2", sub: "/ 5.0", target: "4.0以上", judge: "ok" },
      { label: "投稿数", value: "3", sub: "件 / 月", target: "月4回以上", judge: "warn" },
      { label: "月間表示数", value: "5,120", sub: "回" },
    ],
    goodPoints: ["平均評価は良好です"],
    improvePoints: ["クチコミ返信率が低いです", "投稿頻度が不足しています"],
    actions: [
      { text: "クチコミに返信しましょう", priority: "high" },
      { text: "最新情報を投稿しましょう", priority: "mid" },
    ],
  },
  sns: {
    summary: "フォロワーは増加傾向。投稿の継続が鍵です。",
    subMetrics: [
      { label: "フォロワー", value: "1,240", sub: "人" },
      { label: "エンゲージメント率", value: "3.1%", sub: "", target: "3%以上", judge: "ok" },
      { label: "投稿数", value: "86", sub: "件（累計）" },
      { label: "月間増加", value: "+62", sub: "人", target: "増加が目安", judge: "ok" },
    ],
    goodPoints: ["フォロワー増加が継続しています"],
    improvePoints: ["投稿頻度にムラがあります"],
    actions: [{ text: "週2回の投稿カレンダーを作成しましょう", priority: "mid" }],
  },
  speed: {
    summary: "表示速度は良好。Core Web Vitals も基準内です。",
    subMetrics: [
      { label: "LCP", value: "2.1s", sub: "表示の速さ", target: "2.5秒以内", judge: "ok" },
      { label: "INP", value: "180ms", sub: "反応の速さ", target: "200ms以内", judge: "ok" },
      { label: "CLS", value: "0.05", sub: "レイアウト安定", target: "0.1以内", judge: "ok" },
      { label: "モバイルスコア", value: "90", sub: "/ 100", target: "90以上", judge: "ok" },
    ],
    goodPoints: ["LCP が基準内です", "CLS が安定しています"],
    improvePoints: ["画像最適化の余地があります"],
    actions: [{ text: "画像を WebP 化して軽量化しましょう", priority: "low" }],
  },
  mobile: {
    summary: "モバイルでの見やすさ・操作性は良好です。",
    subMetrics: [
      { label: "タップ要素", value: "適切", sub: "", target: "適切が目安", judge: "ok" },
      { label: "ビューポート", value: "OK", sub: "", target: "設定済みが目安", judge: "ok" },
      { label: "文字サイズ", value: "読みやすい", sub: "", target: "読みやすいが目安", judge: "ok" },
      { label: "モバイル流入", value: "62%", sub: "全体に占める割合" },
    ],
    goodPoints: ["タップ要素の間隔が適切です", "文字サイズが読みやすいです"],
    improvePoints: ["一部フォームが押しにくい箇所があります"],
    actions: [{ text: "フォームのボタンサイズを拡大しましょう", priority: "low" }],
  },
  security: {
    summary: "SSL・セキュリティ設定は良好です。",
    subMetrics: [
      { label: "SSL", value: "有効", sub: "", target: "有効が必須", judge: "ok" },
      { label: "証明書", value: "残90日", sub: "有効期限", target: "残30日以上", judge: "ok" },
      { label: "既知の脆弱性", value: "0", sub: "件", target: "0件", judge: "ok" },
      { label: "安全性評価", value: "A", sub: "", target: "A以上", judge: "ok" },
    ],
    goodPoints: ["SSL が有効です", "既知の脆弱性はありません"],
    improvePoints: ["セキュリティヘッダーの追加余地があります"],
    actions: [{ text: "HSTS などのセキュリティヘッダーを設定しましょう", priority: "low" }],
  },
  content: {
    summary: "更新頻度の低下がスコアに影響しています。",
    subMetrics: [
      { label: "ページ数", value: "42", sub: "本" },
      { label: "更新頻度", value: "月1回", sub: "低め", target: "月2回以上", judge: "warn" },
      { label: "平均文字数", value: "1,200", sub: "字", target: "1,000字以上", judge: "ok" },
      { label: "重複コンテンツ", value: "0", sub: "件", target: "0件", judge: "ok" },
    ],
    goodPoints: ["重複コンテンツはありません"],
    improvePoints: ["更新頻度が低いです", "内容の薄いページがあります"],
    actions: [
      { text: "月2本の記事を追加しましょう", priority: "high" },
      { text: "内容の薄いページを加筆しましょう", priority: "mid" },
    ],
  },
  competitor: {
    summary: "一部指標で競合に劣後。口コミ強化が効果的です。",
    subMetrics: [
      { label: "比較社数", value: "120", sub: "社" },
      { label: "自社順位", value: "17位", sub: "/ 120社", target: "10位以内", judge: "warn" },
      { label: "強み", value: "Web集客", sub: "地域上位", judge: "ok" },
      { label: "弱み", value: "口コミ", sub: "地域32位", judge: "bad" },
    ],
    goodPoints: ["サイト流入は地域で上位です"],
    improvePoints: ["クチコミ数が地域32位と低いです"],
    actions: [{ text: "クチコミ獲得を強化しましょう", priority: "high" }],
  },
  anomaly: {
    summary: "異常は検知されていません。安定して稼働しています。",
    subMetrics: [
      { label: "異常検知", value: "0", sub: "件", target: "0件", judge: "ok" },
      { label: "稼働率", value: "100%", sub: "", target: "99.9%以上", judge: "ok" },
      { label: "エラー", value: "0", sub: "件", target: "0件", judge: "ok" },
      { label: "最終異常", value: "なし", sub: "" },
    ],
    goodPoints: ["異常は検知されていません", "稼働率は100%です"],
    improvePoints: [],
    actions: [],
  },
};

/** id からチェックを取得 */
export function getCheck(id: string): WebCheck | undefined {
  return webChecks.find((c) => c.id === id);
}

/** スコアに収束する決定的な推移を生成（チェック単体の推移グラフ用） */
export function checkTrend(score: number): TrendPoint[] {
  const labels = ["5/10", "5/13", "5/17", "5/20", "5/24", "5/27", "5/31", "6/3", "6/8"];
  const deltas = [-16, -9, -12, -8, -5, -7, -4, -2, 0];
  return labels.map((label, i) => ({
    label,
    score: Math.max(0, Math.min(100, score + deltas[i])),
  }));
}

/* ============================================================
 * 改善タスク（チェックのおすすめアクションから生成）
 * ========================================================== */

export interface ImprovementTask {
  key: string;
  text: string;
  priority: Priority;
  checkId: string;
  checkName: string;
}

export const improvementTasks: ImprovementTask[] = webChecks.flatMap((c) =>
  (checkDetails[c.id]?.actions ?? []).map((a, i) => ({
    key: `${c.id}-${i}`,
    text: a.text,
    priority: a.priority,
    checkId: c.id,
    checkName: c.name,
  })),
);

/* ============================================================
 * レポート（月次・サンプル）
 * ========================================================== */

export interface MonthlyReport {
  month: string; // "2026-06"
  label: string; // "2026年6月"
  score: number;
  delta: number;
}

export const reportHistory: MonthlyReport[] = [
  { month: "2026-06", label: "2026年6月", score: 82, delta: 5 },
  { month: "2026-05", label: "2026年5月", score: 77, delta: 6 },
  { month: "2026-04", label: "2026年4月", score: 71, delta: 4 },
  { month: "2026-03", label: "2026年3月", score: 67, delta: 3 },
  { month: "2026-02", label: "2026年2月", score: 64, delta: 6 },
];

/** スコアからランク表記 */
export function scoreRank(score: number): string {
  if (score >= 90) return "優良";
  if (score >= 75) return "良好";
  if (score >= 60) return "要改善";
  return "要注意";
}

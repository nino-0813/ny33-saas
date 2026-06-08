/**
 * NY33 Company Dock — Phase 1 モックデータ
 * すべて仮データ。Phase 2 以降で Supabase / 各API連携に置き換える。
 */

export type Trend = "up" | "down" | "flat";
export type Rank = "S" | "A" | "B" | "C" | "D";

export interface CompanyProfile {
  name: string;
  industry: string;
  area: string;
  employees: number;
  plan: "ライト" | "スタンダード" | "プロ" | "グロース";
  updatedAt: string;
}

export const company: CompanyProfile = {
  name: "尾道マリン工務店",
  industry: "工務店",
  area: "広島県尾道市",
  employees: 28,
  plan: "スタンダード",
  updatedAt: "2026-06-01",
};

/** 会社健康度（100点満点） */
export interface HealthScore {
  score: number;
  prevScore: number;
  rank: Rank;
  /** 月あたりの利益改善余地（円） */
  improvementYen: number;
  /** カテゴリ別スコア（レーダー用） */
  breakdown: { label: string; score: number }[];
}

export const health: HealthScore = {
  score: 78,
  prevScore: 71,
  rank: "A",
  improvementYen: 1_200_000,
  breakdown: [
    { label: "売上", score: 82 },
    { label: "Web集客", score: 74 },
    { label: "SEO", score: 68 },
    { label: "MEO/口コミ", score: 55 },
    { label: "SNS", score: 71 },
    { label: "LINE", score: 88 },
  ],
};

/** ダッシュボード上部のKPIカード */
export interface Kpi {
  id: string;
  label: string;
  value: string;
  unit?: string;
  deltaLabel: string;
  trend: Trend;
  /** スパークライン用 */
  spark: number[];
}

export const kpis: Kpi[] = [
  {
    id: "sales",
    label: "売上",
    value: "300",
    unit: "万円",
    deltaLabel: "+8.0% 前月比",
    trend: "up",
    spark: [240, 250, 248, 262, 270, 278, 285, 300],
  },
  {
    id: "profit",
    label: "利益",
    value: "72",
    unit: "万円",
    deltaLabel: "+11.2% 前月比",
    trend: "up",
    spark: [52, 55, 54, 60, 63, 66, 68, 72],
  },
  {
    id: "inquiries",
    label: "問い合わせ数",
    value: "34",
    unit: "件",
    deltaLabel: "+6 件 前月比",
    trend: "up",
    spark: [22, 25, 24, 27, 28, 30, 28, 34],
  },
  {
    id: "cvr",
    label: "成約率",
    value: "23.5",
    unit: "%",
    deltaLabel: "-1.2pt 前月比",
    trend: "down",
    spark: [26, 25, 25.5, 24.8, 24, 24.7, 24.7, 23.5],
  },
  {
    id: "seo",
    label: "SEO 平均順位",
    value: "12.4",
    unit: "位",
    deltaLabel: "+2.1 改善",
    trend: "up",
    spark: [18, 17, 16.5, 15.8, 15, 14, 13.2, 12.4],
  },
  {
    id: "meo",
    label: "Google口コミ",
    value: "48",
    unit: "件",
    deltaLabel: "+3 件 前月比",
    trend: "up",
    spark: [38, 39, 41, 42, 43, 45, 45, 48],
  },
  {
    id: "sns",
    label: "Instagram フォロワー",
    value: "1,240",
    unit: "人",
    deltaLabel: "+62 人 前月比",
    trend: "up",
    spark: [980, 1020, 1060, 1095, 1130, 1165, 1190, 1240],
  },
  {
    id: "line",
    label: "LINE 登録者",
    value: "860",
    unit: "人",
    deltaLabel: "ブロック率 4.2%",
    trend: "flat",
    spark: [700, 730, 760, 780, 800, 820, 845, 860],
  },
];

/** Company AI が出す今月の課題 */
export interface AiIssue {
  rank: number;
  title: string;
  detail: string;
  /** 推定損失（円/月） */
  lossYen: number;
  /** 優先度 1-5 */
  priority: number;
  action: string;
}

export const aiIssues: AiIssue[] = [
  {
    rank: 1,
    title: "口コミ不足",
    detail:
      "競合平均より口コミが18件少なく、MEO順位が伸び悩んでいます。来店客への口コミ依頼が仕組み化されていません。",
    lossYen: 80_000,
    priority: 5,
    action: "施工完了時のLINE自動メッセージで口コミ依頼を送る",
  },
  {
    rank: 2,
    title: "SEO 主要KWの取りこぼし",
    detail:
      "「尾道 注文住宅」が11位で1ページ目に入れていません。実例ページの内部リンクと写真最適化で改善余地があります。",
    lossYen: 50_000,
    priority: 4,
    action: "施工事例ページを5本追加し、内部リンクを整理する",
  },
  {
    rank: 3,
    title: "LINE 配信頻度の低下",
    detail:
      "直近2か月配信が止まっており、ブロック率が微増。月2回の定期配信で再来・紹介の機会を作れます。",
    lossYen: 30_000,
    priority: 3,
    action: "月2回（施工事例＋お役立ち）の配信カレンダーを作る",
  },
];

/** データ連携ソース */
export interface DataSource {
  id: string;
  name: string;
  status: "connected" | "syncing" | "disconnected";
  metrics: { label: string; value: string }[];
  lastSync?: string;
}

export const dataSources: DataSource[] = [
  {
    id: "ga4",
    name: "Google Analytics 4",
    status: "connected",
    lastSync: "2026-06-08 06:00",
    metrics: [
      { label: "PV", value: "18,420" },
      { label: "UU", value: "9,310" },
      { label: "CV", value: "34" },
    ],
  },
  {
    id: "gsc",
    name: "Search Console",
    status: "connected",
    lastSync: "2026-06-08 06:00",
    metrics: [
      { label: "検索順位", value: "12.4" },
      { label: "CTR", value: "3.8%" },
    ],
  },
  {
    id: "gbp",
    name: "Google ビジネス",
    status: "connected",
    lastSync: "2026-06-08 06:00",
    metrics: [
      { label: "口コミ", value: "48" },
      { label: "閲覧数", value: "5,120" },
    ],
  },
  {
    id: "instagram",
    name: "Instagram",
    status: "syncing",
    lastSync: "2026-06-07 22:10",
    metrics: [
      { label: "フォロワー", value: "1,240" },
      { label: "投稿数", value: "86" },
    ],
  },
  {
    id: "line",
    name: "LINE 公式アカウント",
    status: "connected",
    lastSync: "2026-06-08 06:00",
    metrics: [
      { label: "登録者", value: "860" },
      { label: "ブロック率", value: "4.2%" },
    ],
  },
];

/** 会社カルテ（毎月保存） */
export interface KarteEntry {
  month: string; // YYYY-MM
  sales: number; // 万円
  profit: number; // 万円
  health: number; // 点
}

export const karte: KarteEntry[] = [
  { month: "2025-09", sales: 232, profit: 50, health: 52 },
  { month: "2025-10", sales: 248, profit: 55, health: 58 },
  { month: "2025-11", sales: 255, profit: 57, health: 61 },
  { month: "2025-12", sales: 270, profit: 60, health: 64 },
  { month: "2026-01", sales: 262, profit: 58, health: 66 },
  { month: "2026-02", sales: 278, profit: 63, health: 69 },
  { month: "2026-03", sales: 285, profit: 66, health: 71 },
  { month: "2026-04", sales: 290, profit: 68, health: 73 },
  { month: "2026-05", sales: 296, profit: 70, health: 75 },
  { month: "2026-06", sales: 300, profit: 72, health: 78 },
];

/** 競合比較（同業他社内での順位） */
export interface CompetitorRow {
  label: string;
  ours: string;
  rankInArea: number;
  totalInArea: number;
  status: "good" | "warn" | "bad";
}

export const competitor = {
  area: "福山市・尾道市の工務店",
  total: 120,
  rows: [
    { label: "SEO 平均順位", ours: "12.4位", rankInArea: 17, totalInArea: 120, status: "warn" },
    { label: "Google口コミ数", ours: "48件", rankInArea: 32, totalInArea: 120, status: "bad" },
    { label: "Instagram フォロワー", ours: "1,240人", rankInArea: 14, totalInArea: 120, status: "good" },
    { label: "サイト月間PV", ours: "18,420", rankInArea: 9, totalInArea: 120, status: "good" },
    { label: "LINE 登録者", ours: "860人", rankInArea: 6, totalInArea: 120, status: "good" },
  ] as CompetitorRow[],
};

/** 通貨フォーマット（万円表記の補助） */
export function yen(n: number): string {
  return new Intl.NumberFormat("ja-JP", {
    style: "currency",
    currency: "JPY",
    maximumFractionDigits: 0,
  }).format(n);
}

/** 健康度スコアからランクを算出 */
export function rankFromScore(score: number): Rank {
  if (score >= 90) return "S";
  if (score >= 75) return "A";
  if (score >= 60) return "B";
  if (score >= 45) return "C";
  return "D";
}

/* ============================================================
 * Company AI ページ用
 * ========================================================== */

export const aiPersonas = [
  {
    id: "consultant",
    label: "経営コンサル",
    desc: "利益構造と優先順位を診断",
  },
  {
    id: "marketer",
    label: "マーケター",
    desc: "集客・SNS・広告の改善案",
  },
  {
    id: "analyst",
    label: "データアナリスト",
    desc: "数値の変化と要因を分析",
  },
];

export const aiSuggestedQuestions: string[] = [
  "今月、利益を上げる一番の方法は？",
  "口コミを増やすには何をすればいい？",
  "競合より弱いのはどこ？",
  "来月の売上予測を教えて",
];

export interface ChatMessage {
  role: "ai" | "user";
  text: string;
  /** AIの回答に添える数値カード */
  facts?: { label: string; value: string; tone?: "good" | "bad" | "primary" }[];
}

export const aiConversation: ChatMessage[] = [
  {
    role: "user",
    text: "今月、利益を上げる一番の方法は？",
  },
  {
    role: "ai",
    text: "現状のデータを分析すると、最優先は『口コミ不足』の解消です。地域120社中で口コミ数が32位と低く、MEO順位の伸び悩みにつながっています。施工完了時のLINE自動メッセージで口コミ依頼を仕組み化すると、口コミを月20件増やせる見込みです。",
    facts: [
      { label: "口コミ +20件で問い合わせ", value: "+3 件/月", tone: "primary" },
      { label: "想定利益インパクト", value: "+18万円/月", tone: "good" },
      { label: "実装の手間", value: "約2時間", tone: "primary" },
    ],
  },
  {
    role: "user",
    text: "SEOはどうすればいい？",
  },
  {
    role: "ai",
    text: "「尾道 注文住宅」が現在11位で、1ページ目まであと一歩です。施工事例ページを5本追加し、各ページから関連事例への内部リンクを整えると、3か月で1ページ目（8位前後）が狙えます。写真のalt最適化も併せて行いましょう。",
    facts: [
      { label: "目標順位", value: "11位 → 8位", tone: "primary" },
      { label: "想定流入増", value: "+1,200 PV/月", tone: "good" },
    ],
  },
];

/* ============================================================
 * データ連携ページ用（未連携で追加できるソース）
 * ========================================================== */

export interface AvailableSource {
  id: string;
  name: string;
  desc: string;
}

export const availableSources: AvailableSource[] = [
  { id: "meta-ads", name: "Meta 広告", desc: "Instagram / Facebook 広告の費用対効果を取得" },
  { id: "google-ads", name: "Google 広告", desc: "リスティング広告のクリック・CVを取得" },
  { id: "freee", name: "freee 会計", desc: "売上・利益などの会計データを自動取得" },
];

export interface SyncEvent {
  time: string;
  source: string;
  result: "success" | "warning";
  note: string;
}

export const syncHistory: SyncEvent[] = [
  { time: "2026-06-08 06:00", source: "全ソース", result: "success", note: "定期同期が完了しました" },
  { time: "2026-06-07 22:10", source: "Instagram", result: "warning", note: "一部の投稿インサイトを再取得中" },
  { time: "2026-06-07 06:00", source: "全ソース", result: "success", note: "定期同期が完了しました" },
  { time: "2026-06-06 06:00", source: "全ソース", result: "success", note: "定期同期が完了しました" },
];

/* ============================================================
 * 競合比較ページ用（業界平均・トップとの比較）
 * ========================================================== */

export interface CompareMetric {
  label: string;
  ours: number;
  industryAvg: number;
  top: number;
  unit: string;
  /** 値が高いほど良いか（順位は false） */
  higherIsBetter: boolean;
}

export const compareMetrics: CompareMetric[] = [
  { label: "SEO 平均順位", ours: 12.4, industryAvg: 18.5, top: 3.2, unit: "位", higherIsBetter: false },
  { label: "Google 口コミ数", ours: 48, industryAvg: 65, top: 210, unit: "件", higherIsBetter: true },
  { label: "サイト月間PV", ours: 18420, industryAvg: 9800, top: 42000, unit: "", higherIsBetter: true },
  { label: "Instagram フォロワー", ours: 1240, industryAvg: 980, top: 5600, unit: "人", higherIsBetter: true },
  { label: "LINE 登録者", ours: 860, industryAvg: 420, top: 2100, unit: "人", higherIsBetter: true },
  { label: "成約率", ours: 23.5, industryAvg: 19.0, top: 31.0, unit: "%", higherIsBetter: true },
];

/* ============================================================
 * Company GPT ページ用（近日公開・社長専用AIのプレビュー）
 * ========================================================== */

export interface GptExample {
  q: string;
  a: string;
  facts: { label: string; value: string }[];
}

export const gptExamples: GptExample[] = [
  {
    q: "今月、利益を上げる方法は？",
    a: "口コミを20件増やすと、問い合わせが月3件増え、予想利益は+18万円。最優先で取り組む価値があります。",
    facts: [
      { label: "問い合わせ", value: "+3 件" },
      { label: "予想利益", value: "+18万円" },
    ],
  },
  {
    q: "広告に月10万円使うべき？",
    a: "現状はSEOと口コミの伸びしろが大きいため、広告より先に無料施策で月+12万円が狙えます。広告は来期、基盤が整ってからを推奨します。",
    facts: [
      { label: "無料施策の余地", value: "+12万円/月" },
      { label: "推奨タイミング", value: "来期" },
    ],
  },
];

export const gptFeatures = [
  "売上・利益・集客データをすべて理解した、あなた専用のAI",
  "「どうすれば儲かる？」に数字で即答",
  "施策の利益インパクトをシミュレーション",
  "毎朝、今日やるべき1つの改善を提案",
];

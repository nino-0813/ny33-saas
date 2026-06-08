import "server-only";

/**
 * 実データからチェックスコアを算出する（透明な簡易ロジック）。
 * 採点根拠はコメントに明記。将来、業界ベンチマーク等で精緻化する。
 */

/** GA4（アクセス・集客）: 訪問者・PV・コンバージョンの有無で簡易採点 */
export function scoreGa4(s: { pv: number; uu: number; cv: number }): number {
  let score = 0;
  if (s.uu > 0) score += 50; // 訪問者がいる
  if (s.pv > 0) score += 20; // PV が発生している
  score += Math.min(s.cv * 6, 30); // コンバージョン（最大 +30）
  return clamp(score);
}

/** Search Console（SEO）: 平均掲載順位が良いほど高スコア（順位ベース） */
export function scoreGsc(s: { position: number; ctr: number }): number {
  const pos = s.position > 0 ? s.position : 100;
  // 順位1位 ≒ 100点、順位が下がるほど低下（おおよそ 1位=106→100, 50位前後で0付近）
  return clamp(Math.round(108 - pos * 2));
}

function clamp(n: number): number {
  return Math.max(0, Math.min(100, Math.round(n)));
}

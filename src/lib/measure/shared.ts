import type { CheckStatus, SubMetric } from "@/lib/webdock";

export interface MeasureResult {
  score: number; // 0-100
  status: CheckStatus;
  metrics: SubMetric[];
  note: string;
}

export function statusFromScore(score: number): CheckStatus {
  if (score >= 80) return "ok";
  if (score >= 50) return "warn";
  return "bad";
}

/** 計測対象のチェック（外部審査不要） */
export const MEASURABLE = new Set(["speed", "mobile", "security"]);

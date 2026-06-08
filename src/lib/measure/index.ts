import "server-only";
import { runPageSpeed } from "./pagespeed";
import { runSecurity } from "./ssl";
import { MEASURABLE, type MeasureResult } from "./shared";

export { MEASURABLE };
export type { MeasureResult };

/** チェックキーに応じて実測を実行 */
export async function measureCheck(
  checkKey: string,
  url: string,
): Promise<MeasureResult> {
  if (checkKey === "speed") return runPageSpeed(url, "desktop");
  if (checkKey === "mobile") return runPageSpeed(url, "mobile");
  if (checkKey === "security") return runSecurity(url);
  throw new Error("このチェックは自動計測の対象外です");
}

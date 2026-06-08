import "server-only";
import tls from "node:tls";
import { statusFromScore, type MeasureResult } from "./shared";

/** TLS 証明書の残り日数を取得（取れなければ null） */
function getCertDaysLeft(host: string): Promise<number | null> {
  return new Promise((resolve) => {
    const socket = tls.connect(
      { host, port: 443, servername: host, timeout: 8000 },
      () => {
        const cert = socket.getPeerCertificate();
        socket.end();
        if (cert && cert.valid_to) {
          const days = Math.floor(
            (Date.parse(cert.valid_to) - Date.now()) / 86_400_000,
          );
          resolve(days);
        } else {
          resolve(null);
        }
      },
    );
    socket.on("error", () => resolve(null));
    socket.on("timeout", () => {
      socket.destroy();
      resolve(null);
    });
  });
}

/** SSL・セキュリティヘッダーを実測 */
export async function runSecurity(url: string): Promise<MeasureResult> {
  const u = new URL(url);
  const isHttps = u.protocol === "https:";

  let headers: Headers | null = null;
  try {
    const res = await fetch(url, { redirect: "follow", cache: "no-store" });
    headers = res.headers;
  } catch {
    // ヘッダー取得失敗（到達不可など）
  }

  const has = (h: string) => Boolean(headers?.get(h));
  const hsts = has("strict-transport-security");
  const csp = has("content-security-policy");
  const xcto = has("x-content-type-options");
  const xfo = has("x-frame-options") || csp;
  const certDays = isHttps ? await getCertDaysLeft(u.hostname) : null;

  let score = 0;
  if (isHttps) score += 40;
  if (certDays != null && certDays > 14) score += 10;
  if (hsts) score += 20;
  if (csp) score += 15;
  if (xcto) score += 10;
  if (xfo) score += 5;

  const headerCount = [hsts, csp, xcto, xfo].filter(Boolean).length;

  return {
    score,
    status: statusFromScore(score),
    metrics: [
      { label: "SSL", value: isHttps ? "有効" : "無効" },
      { label: "証明書", value: certDays != null ? `残${certDays}日` : "—" },
      { label: "主要ヘッダー", value: `${headerCount}/4` },
      { label: "HSTS", value: hsts ? "有" : "無" },
    ],
    note: "SSL・セキュリティヘッダーの実測",
  };
}

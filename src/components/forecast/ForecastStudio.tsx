"use client";

import Link from "next/link";
import {
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
} from "react";
import {
  AlertCircle,
  ArrowRight,
  BarChart3,
  CalendarClock,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  Lightbulb,
  Loader2,
  Play,
  Sparkles,
  TrendingDown,
  TrendingUp,
  Upload,
} from "lucide-react";
import {
  Area,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card } from "@/components/ui";

type CsvRow = Record<string, string>;

type ForecastPoint = {
  date: string;
  forecast: number;
  lower_10: number;
  upper_90: number;
};

type ForecastResponse = {
  model: string;
  context_points: number;
  forecast: ForecastPoint[];
};

type ChartPoint = {
  date: string;
  actual?: number;
  forecast?: number;
  lower?: number;
  interval?: number;
};

const frequencyOptions = [
  { value: "D", label: "日次" },
  { value: "W", label: "週次" },
  { value: "MS", label: "月次" },
  { value: "h", label: "時間ごと" },
];

function parseCsv(text: string): { headers: string[]; rows: CsvRow[] } {
  const lines = text
    .replace(/^\uFEFF/, "")
    .split(/\r?\n/)
    .filter((line) => line.trim());
  if (lines.length < 2) throw new Error("CSVには見出しと1行以上のデータが必要です。");

  const splitLine = (line: string) => {
    const cells: string[] = [];
    let cell = "";
    let quoted = false;
    for (let i = 0; i < line.length; i += 1) {
      const char = line[i];
      if (char === '"') {
        if (quoted && line[i + 1] === '"') {
          cell += '"';
          i += 1;
        } else {
          quoted = !quoted;
        }
      } else if (char === "," && !quoted) {
        cells.push(cell.trim());
        cell = "";
      } else {
        cell += char;
      }
    }
    cells.push(cell.trim());
    return cells;
  };

  const headers = splitLine(lines[0]);
  const rows = lines.slice(1).map((line) => {
    const values = splitLine(line);
    return Object.fromEntries(headers.map((header, i) => [header, values[i] ?? ""]));
  });
  return { headers, rows };
}

function makeSample() {
  const rows: CsvRow[] = [];
  const start = new Date("2023-01-01T00:00:00");
  for (let i = 0; i < 160; i += 1) {
    const date = new Date(start);
    date.setDate(start.getDate() + i * 7);
    const trend = 80 + i * 0.42;
    const seasonal = 16 * Math.sin((i * Math.PI * 2) / 52);
    const noise = Math.sin(i * 1.71) * 3.2;
    rows.push({
      date: date.toISOString().slice(0, 10),
      search_interest: Math.max(0, trend + seasonal + noise).toFixed(2),
    });
  }
  return { headers: ["date", "search_interest"], rows };
}

function downloadCsv(points: ForecastPoint[]) {
  const header = "date,forecast,lower_10_percentile,upper_90_percentile";
  const body = points
    .map((p) => `${p.date},${p.forecast},${p.lower_10},${p.upper_90}`)
    .join("\n");
  const blob = new Blob([`\uFEFF${header}\n${body}`], {
    type: "text/csv;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "timesfm_forecast.csv";
  anchor.click();
  URL.revokeObjectURL(url);
}

function compactDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : new Intl.DateTimeFormat("ja-JP", {
        month: "numeric",
        day: "numeric",
      }).format(date);
}

const PERIOD_WORD: Record<string, string> = {
  h: "前時間比",
  D: "前日比",
  W: "前週比",
  MS: "前月比",
  QS: "前四半期比",
};

/** ピーク／注意月などの見出し用に「2026年8月」のような期間ラベルへ整形する */
function periodLabel(value: string, frequency: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  if (frequency === "h") {
    return new Intl.DateTimeFormat("ja-JP", {
      month: "long",
      day: "numeric",
      hour: "numeric",
    }).format(date);
  }
  if (frequency === "D" || frequency === "W") {
    return new Intl.DateTimeFormat("ja-JP", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(date);
  }
  return new Intl.DateTimeFormat("ja-JP", {
    year: "numeric",
    month: "long",
  }).format(date);
}

function fmt(value: number) {
  return value.toLocaleString("ja-JP", { maximumFractionDigits: 1 });
}

type DemandLevel = "高" | "中" | "低";

type Insights = {
  baseline: number;
  peak: { label: string; value: number; level: DemandLevel; change: number | null };
  trough: { label: string; value: number; level: DemandLevel };
  trendPct: number;
  periodWord: string;
};

/**
 * TimesFM の予測結果と過去実績から、画面に出すインサイトを算出する。
 * 現状はデータからの決定論的な算出。将来 OpenAI 等で文章生成へ差し替え可能。
 */
function buildInsights(
  forecast: ForecastPoint[],
  history: { date: string; value: number }[],
  frequency: string,
): Insights | null {
  if (forecast.length === 0) return null;

  const recent = history.slice(-12);
  const baseline = recent.length
    ? recent.reduce((sum, p) => sum + p.value, 0) / recent.length
    : forecast[0].forecast;

  const level = (value: number): DemandLevel => {
    const ratio = baseline ? value / baseline : 1;
    if (ratio >= 1.1) return "高";
    if (ratio <= 0.9) return "低";
    return "中";
  };

  let peakIdx = 0;
  let troughIdx = 0;
  forecast.forEach((point, i) => {
    if (point.forecast > forecast[peakIdx].forecast) peakIdx = i;
    if (point.forecast < forecast[troughIdx].forecast) troughIdx = i;
  });

  const peak = forecast[peakIdx];
  const trough = forecast[troughIdx];
  const peakPrev =
    peakIdx > 0 ? forecast[peakIdx - 1].forecast : history.at(-1)?.value;
  const change =
    peakPrev && peakPrev !== 0
      ? ((peak.forecast - peakPrev) / peakPrev) * 100
      : null;

  const avgForecast =
    forecast.reduce((sum, p) => sum + p.forecast, 0) / forecast.length;
  const trendPct = baseline ? ((avgForecast - baseline) / baseline) * 100 : 0;

  return {
    baseline,
    peak: {
      label: periodLabel(peak.date, frequency),
      value: peak.forecast,
      level: level(peak.forecast),
      change,
    },
    trough: {
      label: periodLabel(trough.date, frequency),
      value: trough.forecast,
      level: level(trough.forecast),
    },
    trendPct,
    periodWord: PERIOD_WORD[frequency] ?? "前期比",
  };
}

const LEVEL_CLASS: Record<DemandLevel, string> = {
  高: "bg-good-weak text-good",
  中: "bg-primary-weak text-primary",
  低: "bg-bad-weak text-bad",
};

export default function ForecastStudio() {
  const fileInput = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState("サンプルデータ");
  const [headers, setHeaders] = useState<string[]>(() => makeSample().headers);
  const [rows, setRows] = useState<CsvRow[]>(() => makeSample().rows);
  const [dateColumn, setDateColumn] = useState("date");
  const [valueColumn, setValueColumn] = useState("search_interest");
  const [frequency, setFrequency] = useState("W");
  const [horizon, setHorizon] = useState(12);
  const [nonNegative, setNonNegative] = useState(true);
  const [result, setResult] = useState<ForecastResponse | null>(null);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  const validHistory = useMemo(
    () =>
      rows
        .map((row) => ({
          date: row[dateColumn],
          value: Number(row[valueColumn]),
        }))
        .filter(
          (row) =>
            row.date &&
            Number.isFinite(row.value) &&
            !Number.isNaN(new Date(row.date).getTime()),
        )
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
    [rows, dateColumn, valueColumn],
  );

  const chartData = useMemo<ChartPoint[]>(() => {
    const history = validHistory.slice(-120).map((point) => ({
      date: point.date,
      actual: point.value,
    }));
    const forecast = (result?.forecast ?? []).map((point) => ({
      date: point.date,
      forecast: point.forecast,
      lower: point.lower_10,
      interval: point.upper_90 - point.lower_10,
    }));
    return [...history, ...forecast];
  }, [result, validHistory]);

  async function handleFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setError("");
    setResult(null);
    try {
      const bytes = await file.arrayBuffer();
      let text = new TextDecoder("utf-8").decode(bytes);
      if (text.includes("\uFFFD")) {
        text = new TextDecoder("shift_jis").decode(bytes);
      }
      const parsed = parseCsv(text);
      setFileName(file.name);
      setHeaders(parsed.headers);
      setRows(parsed.rows);
      setDateColumn(parsed.headers[0]);
      setValueColumn(parsed.headers[1] ?? parsed.headers[0]);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "CSVを読み込めませんでした。");
    }
  }

  function resetSample() {
    const sample = makeSample();
    setFileName("サンプルデータ");
    setHeaders(sample.headers);
    setRows(sample.rows);
    setDateColumn("date");
    setValueColumn("search_interest");
    setFrequency("W");
    setResult(null);
    setError("");
  }

  async function runForecast() {
    setError("");
    setResult(null);
    if (validHistory.length < 20) {
      setError("有効な時系列データが20件以上必要です。日付列と数値列を確認してください。");
      return;
    }
    setPending(true);
    try {
      const response = await fetch("/api/forecast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dates: validHistory.map((point) => point.date),
          values: validHistory.map((point) => point.value),
          frequency,
          horizon,
          non_negative: nonNegative,
        }),
      });
      const data = (await response.json()) as ForecastResponse & { error?: string };
      if (!response.ok) throw new Error(data.error || "予測に失敗しました。");
      setResult(data);
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "予測サービスに接続できませんでした。",
      );
    } finally {
      setPending(false);
    }
  }

  const latest = validHistory.at(-1)?.value;
  const finalForecast = result?.forecast.at(-1)?.forecast;
  const change =
    latest !== undefined && finalForecast !== undefined
      ? finalForecast - latest
      : undefined;

  const insights = useMemo(
    () =>
      result ? buildInsights(result.forecast, validHistory, frequency) : null,
    [result, validHistory, frequency],
  );

  return (
    <>
      <div className="grid gap-5 xl:grid-cols-[320px_minmax(0,1fr)]">
        <Card className="h-fit p-5">
          <div className="mb-5 flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-weak text-primary">
              <FileSpreadsheet className="h-5 w-5" />
            </span>
            <div>
              <h2 className="text-sm font-bold text-foreground">予測データ</h2>
              <p className="text-xs text-muted">CSVまたはサンプルを使用</p>
            </div>
          </div>

          <input
            ref={fileInput}
            type="file"
            accept=".csv,text/csv"
            className="sr-only"
            onChange={handleFile}
          />
          <button
            type="button"
            onClick={() => fileInput.current?.click()}
            className="flex min-h-24 w-full flex-col items-center justify-center rounded-xl border border-dashed border-primary/40 bg-primary-weak/30 px-4 py-4 text-center transition-colors hover:bg-primary-weak/60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            <Upload className="mb-2 h-5 w-5 text-primary" />
            <span className="text-sm font-bold text-primary">CSVをアップロード</span>
            <span className="mt-1 max-w-full truncate text-xs text-muted">{fileName}</span>
          </button>
          <button
            type="button"
            onClick={resetSample}
            className="mt-2 min-h-11 w-full rounded-lg border border-border text-sm font-medium text-foreground transition-colors hover:bg-surface-2"
          >
            サンプルデータで試す
          </button>

          <div className="mt-5 space-y-4">
            <Field label="日付列">
              <select
                value={dateColumn}
                onChange={(event) => setDateColumn(event.target.value)}
                className="h-11 w-full rounded-lg border border-border bg-surface px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              >
                {headers.map((header) => (
                  <option key={header}>{header}</option>
                ))}
              </select>
            </Field>
            <Field label="予測対象列">
              <select
                value={valueColumn}
                onChange={(event) => setValueColumn(event.target.value)}
                className="h-11 w-full rounded-lg border border-border bg-surface px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              >
                {headers.map((header) => (
                  <option key={header}>{header}</option>
                ))}
              </select>
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="データ周期">
                <select
                  value={frequency}
                  onChange={(event) => setFrequency(event.target.value)}
                  className="h-11 w-full rounded-lg border border-border bg-surface px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                >
                  {frequencyOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="予測期間">
                <input
                  type="number"
                  min={1}
                  max={1000}
                  value={horizon}
                  onChange={(event) =>
                    setHorizon(Math.max(1, Math.min(1000, Number(event.target.value))))
                  }
                  className="h-11 w-full rounded-lg border border-border bg-surface px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </Field>
            </div>
            <label className="flex min-h-11 cursor-pointer items-center gap-3 rounded-lg bg-surface-2 px-3 text-sm text-foreground">
              <input
                type="checkbox"
                checked={nonNegative}
                onChange={(event) => setNonNegative(event.target.checked)}
                className="h-4 w-4 accent-primary"
              />
              予測値を0以上にする
            </label>
          </div>

          <button
            type="button"
            onClick={runForecast}
            disabled={pending}
            className="mt-5 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-bold text-white transition-colors hover:bg-primary/90 disabled:cursor-wait disabled:opacity-60"
          >
            {pending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Play className="h-4 w-4 fill-current" />
            )}
            {pending ? "TimesFMで予測中..." : "予測を実行"}
          </button>
        </Card>

        <div className="min-w-0 space-y-5">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Metric label="データ件数" value={`${validHistory.length.toLocaleString()}件`} />
            <Metric
              label="最終実績"
              value={latest === undefined ? "—" : latest.toLocaleString("ja-JP", { maximumFractionDigits: 2 })}
            />
            <Metric label="予測期間" value={`${horizon}ステップ`} />
            <Metric
              label="予測後の変化"
              value={
                change === undefined
                  ? "—"
                  : `${change >= 0 ? "+" : ""}${change.toLocaleString("ja-JP", { maximumFractionDigits: 2 })}`
              }
              tone={change === undefined ? "default" : change >= 0 ? "good" : "bad"}
            />
          </div>

          {error && (
            <div
              role="alert"
              className="flex items-start gap-3 rounded-xl bg-bad-weak px-4 py-3 text-sm text-bad"
            >
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
              <div>
                <p className="font-bold">予測できませんでした</p>
                <p className="mt-0.5">{error}</p>
              </div>
            </div>
          )}

          <Card className="overflow-hidden">
            <div className="flex flex-col gap-3 border-b border-border px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-primary" />
                  <h2 className="text-sm font-bold text-foreground">実績と将来予測</h2>
                </div>
                <p className="mt-1 text-xs text-muted">
                  緑線が予測値、薄い帯が10〜90%の予測区間です。
                </p>
              </div>
              {result && (
                <button
                  type="button"
                  onClick={() => downloadCsv(result.forecast)}
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-border px-3 text-xs font-bold text-foreground transition-colors hover:bg-surface-2"
                >
                  <Download className="h-4 w-4" />
                  CSVダウンロード
                </button>
              )}
            </div>
            <div className="h-[440px] p-3 sm:p-5">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={chartData} margin={{ top: 10, right: 12, bottom: 0, left: 0 }}>
                  <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
                  <XAxis
                    dataKey="date"
                    tickFormatter={compactDate}
                    tick={{ fill: "var(--muted)", fontSize: 11 }}
                    tickLine={false}
                    axisLine={{ stroke: "var(--border)" }}
                    minTickGap={28}
                  />
                  <YAxis
                    tick={{ fill: "var(--muted)", fontSize: 11 }}
                    tickLine={false}
                    axisLine={false}
                    width={48}
                  />
                  <Tooltip
                    labelFormatter={(label) => String(label)}
                    formatter={(value, name) => [
                      Number(value).toLocaleString("ja-JP", { maximumFractionDigits: 2 }),
                      name === "actual" ? "実績" : name === "forecast" ? "予測" : "予測区間",
                    ]}
                    contentStyle={{
                      border: "1px solid var(--border)",
                      borderRadius: 12,
                      boxShadow: "0 8px 24px rgba(15,31,51,.08)",
                    }}
                  />
                  <Legend
                    formatter={(value) =>
                      value === "actual" ? "実績" : value === "forecast" ? "予測" : "10〜90%予測区間"
                    }
                  />
                  <Area
                    type="monotone"
                    dataKey="lower"
                    stackId="interval"
                    stroke="none"
                    fill="transparent"
                    legendType="none"
                    isAnimationActive={false}
                  />
                  <Area
                    type="monotone"
                    dataKey="interval"
                    stackId="interval"
                    stroke="none"
                    fill="var(--primary)"
                    fillOpacity={0.14}
                    isAnimationActive={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="actual"
                    stroke="var(--navy)"
                    strokeWidth={2}
                    dot={false}
                    connectNulls={false}
                    isAnimationActive={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="forecast"
                    stroke="var(--primary)"
                    strokeWidth={3}
                    dot={false}
                    connectNulls={false}
                    isAnimationActive={false}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {insights && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                <h2 className="text-sm font-bold text-foreground">予測からわかること</h2>
                <span className="rounded-full bg-surface-2 px-2 py-0.5 text-[11px] text-muted">
                  予測データから自動生成
                </span>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                {/* 需要ピーク */}
                <Card className="p-5">
                  <div className="mb-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-good-weak text-good">
                        <TrendingUp className="h-4 w-4" />
                      </span>
                      <h3 className="text-sm font-bold text-foreground">需要ピーク</h3>
                    </div>
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-bold ${LEVEL_CLASS[insights.peak.level]}`}
                    >
                      需要レベル：{insights.peak.level}
                    </span>
                  </div>
                  <p className="text-lg font-bold text-foreground">{insights.peak.label}</p>
                  <div className="mt-2 flex flex-wrap items-baseline gap-x-4 gap-y-1">
                    <span className="tnum text-2xl font-bold text-good">
                      {fmt(insights.peak.value)}
                    </span>
                    {insights.peak.change !== null && (
                      <span className="text-xs text-muted">
                        {insights.periodWord}：
                        <span
                          className={`font-bold ${insights.peak.change >= 0 ? "text-good" : "text-bad"}`}
                        >
                          {insights.peak.change >= 0 ? "+" : ""}
                          {insights.peak.change.toLocaleString("ja-JP", {
                            maximumFractionDigits: 1,
                          })}
                          %
                        </span>
                      </span>
                    )}
                  </div>
                  <p className="mt-3 text-xs leading-relaxed text-muted">
                    この時期に需要が最大化する予測です。1〜2期前までに打ち手を仕込むのが効果的です。
                  </p>
                </Card>

                {/* 注意月 */}
                <Card className="p-5">
                  <div className="mb-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-bad-weak text-bad">
                        <TrendingDown className="h-4 w-4" />
                      </span>
                      <h3 className="text-sm font-bold text-foreground">注意月</h3>
                    </div>
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-bold ${LEVEL_CLASS[insights.trough.level]}`}
                    >
                      需要レベル：{insights.trough.level}
                    </span>
                  </div>
                  <p className="text-lg font-bold text-foreground">{insights.trough.label}</p>
                  <span className="tnum mt-2 block text-2xl font-bold text-bad">
                    {fmt(insights.trough.value)}
                  </span>
                  <p className="mt-3 text-xs leading-relaxed text-muted">
                    需要が落ち込む予測。法人・リピーター・地元利用など、閑散期向けプランへの切り替えを検討してください。
                  </p>
                </Card>
              </div>

              {/* おすすめ施策 */}
              <Card className="p-5">
                <div className="mb-3 flex items-center gap-2">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-weak text-primary">
                    <Lightbulb className="h-4 w-4" />
                  </span>
                  <h3 className="text-sm font-bold text-foreground">おすすめ施策</h3>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <p className="mb-2 flex items-center gap-1.5 text-xs font-bold text-good">
                      <CalendarClock className="h-3.5 w-3.5" />
                      {insights.peak.label}のピークに向けて
                    </p>
                    <ul className="space-y-1.5 text-xs leading-relaxed text-foreground">
                      <li>・該当キーワードのLP・キャンペーンページをピークの1〜2期前までに公開</li>
                      <li>・Googleビジネスプロフィール投稿を週2回に強化</li>
                      <li>・Instagramリール・投稿を増やして露出を確保</li>
                      <li>・ピークキーワードのSEO記事／モデルコース記事を仕込む</li>
                    </ul>
                  </div>
                  <div>
                    <p className="mb-2 flex items-center gap-1.5 text-xs font-bold text-bad">
                      <CalendarClock className="h-3.5 w-3.5" />
                      {insights.trough.label}の落ち込み対策
                    </p>
                    <ul className="space-y-1.5 text-xs leading-relaxed text-foreground">
                      <li>・法人・リピーター・地元向けプランに切り替え</li>
                      <li>・平日割やクーポンで底上げ、閑散期限定プランを用意</li>
                      <li>・既存顧客へのLINE／メール再訪促進を強化</li>
                    </ul>
                  </div>
                </div>
                <p className="mt-4 border-t border-border pt-3 text-[11px] leading-relaxed text-muted">
                  予測期間全体のトレンドは直近実績比{" "}
                  <span
                    className={`font-bold ${insights.trendPct >= 0 ? "text-good" : "text-bad"}`}
                  >
                    {insights.trendPct >= 0 ? "+" : ""}
                    {insights.trendPct.toLocaleString("ja-JP", { maximumFractionDigits: 1 })}%
                  </span>
                  。施策文面のAI自動生成は OPENAI_API_KEY 設定後に有効化できます。
                </p>
                <Link
                  href="/consulting"
                  className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-lg bg-navy px-4 text-xs font-bold text-white transition-colors hover:bg-navy/90"
                >
                  この施策のROIを試算する
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Card>
            </div>
          )}

          {result ? (
            <Card className="overflow-hidden">
              <div className="flex items-center justify-between border-b border-border px-5 py-4">
                <div>
                  <h2 className="text-sm font-bold text-foreground">予測結果</h2>
                  <p className="mt-0.5 text-xs text-muted">
                    {result.model}・履歴 {result.context_points}件を使用
                  </p>
                </div>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-good-weak px-3 py-1 text-xs font-bold text-good">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  完了
                </span>
              </div>
              <div className="max-h-80 overflow-auto">
                <table className="w-full min-w-[620px] text-sm">
                  <thead className="sticky top-0 bg-surface-2 text-left text-xs text-muted">
                    <tr>
                      <th className="px-5 py-3 font-medium">日付</th>
                      <th className="px-5 py-3 text-right font-medium">予測値</th>
                      <th className="px-5 py-3 text-right font-medium">下限（10%）</th>
                      <th className="px-5 py-3 text-right font-medium">上限（90%）</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {result.forecast.map((point) => (
                      <tr key={point.date} className="hover:bg-surface-2/60">
                        <td className="px-5 py-3 text-foreground">{point.date}</td>
                        <td className="tnum px-5 py-3 text-right font-bold text-primary">
                          {point.forecast.toLocaleString("ja-JP", { maximumFractionDigits: 2 })}
                        </td>
                        <td className="tnum px-5 py-3 text-right text-muted">
                          {point.lower_10.toLocaleString("ja-JP", { maximumFractionDigits: 2 })}
                        </td>
                        <td className="tnum px-5 py-3 text-right text-muted">
                          {point.upper_90.toLocaleString("ja-JP", { maximumFractionDigits: 2 })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          ) : (
            <div className="flex items-start gap-3 rounded-2xl border border-primary/20 bg-primary-weak/40 px-5 py-4">
              <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
              <div>
                <p className="text-sm font-bold text-foreground">まずはサンプルで試せます</p>
                <p className="mt-1 text-xs leading-relaxed text-muted">
                  左の「予測を実行」を押すと、週次の検索需要を12週間先まで予測します。
                  独自CSVでは日付列と数値列を選択してください。
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-bold text-foreground">{label}</span>
      {children}
    </label>
  );
}

function Metric({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: string;
  tone?: "default" | "good" | "bad";
}) {
  const color =
    tone === "good" ? "text-good" : tone === "bad" ? "text-bad" : "text-foreground";
  return (
    <Card className="p-4">
      <p className="text-xs font-medium text-muted">{label}</p>
      <p className={`tnum mt-1 truncate text-xl font-bold ${color}`}>{value}</p>
    </Card>
  );
}

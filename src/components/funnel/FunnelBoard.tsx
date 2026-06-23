"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export interface FunnelStageInput {
  key: string;
  rate: number; // 0..1 その段階の通過率（高いほど良い）
}

interface BandMeta {
  key: string;
  name: string;
  sub: string;
  img: string;
  w: number; // 表示幅（高さ58pxに合わせて元画像比から算出）
  text: string;
}

const BAND_H = 58;

const BANDS: BandMeta[] = [
  { key: "awareness", name: "認知", sub: "知られているか", img: "/funnel/band-awareness.png", w: 372, text: "#0C447C" },
  { key: "interest", name: "興味", sub: "興味を持たれたか", img: "/funnel/band-interest.png", w: 340, text: "#0F6E56" },
  { key: "action", name: "行動", sub: "サイトに来たか", img: "/funnel/band-action.png", w: 313, text: "#3B6D11" },
  { key: "comparison", name: "比較", sub: "比べてもらえたか", img: "/funnel/band-comparison.png", w: 284, text: "#854F0B" },
  { key: "purchase", name: "購買", sub: "買ってもらえたか", img: "/funnel/band-purchase.png", w: 259, text: "#993C1D" },
  { key: "usage", name: "利用", sub: "使ってもらえたか", img: "/funnel/band-usage.png", w: 234, text: "#8A4F0B" },
  { key: "loyalty", name: "愛情", sub: "ファンになったか", img: "/funnel/band-loyalty.png", w: 211, text: "#3C3489" },
];

const LEAK_THRESHOLD = 0.5;

const SAMPLE: FunnelStageInput[] = [
  { key: "awareness", rate: 0.85 },
  { key: "interest", rate: 0.8 },
  { key: "action", rate: 0.7 },
  { key: "comparison", rate: 0.75 },
  { key: "purchase", rate: 0.15 },
  { key: "usage", rate: 0.6 },
  { key: "loyalty", rate: 0.55 },
];

export default function FunnelBoard({
  stages = SAMPLE,
}: {
  stages?: FunnelStageInput[];
}) {
  const rateBy = new Map(stages.map((s) => [s.key, s.rate]));
  const rows = BANDS.map((b) => ({ ...b, rate: rateBy.get(b.key) ?? 0.5 }));

  const flow = rows.reduce((a, r) => a * r.rate, 1);
  const fillTarget = Math.max(6, Math.round(flow * 100));
  const worst = rows.reduce((w, r) => (r.rate < w.rate ? r : w), rows[0]);

  const [fill, setFill] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setFill(fillTarget), 250);
    return () => clearTimeout(t);
  }, [fillTarget]);

  return (
    <div className="relative overflow-hidden rounded-3xl border border-border bg-surface p-5 shadow-sm sm:p-7">
      {/* 航海図の背景（うっすら・船をドックに入れる世界観） */}
      <Image
        src="/funnel/chart-bg.png"
        alt=""
        aria-hidden
        fill
        sizes="800px"
        className="pointer-events-none object-cover opacity-[0.07]"
        priority={false}
      />

      <div className="relative">
        {/* 見出し */}
        <div className="mb-5 text-center">
          <h2 className="text-2xl font-bold tracking-wide text-foreground">集客ファネル（7段階）</h2>
          <p className="mt-1 text-sm text-muted">
            お客様がサービスを知ってからファンになるまでの流れ
          </p>
        </div>

        {/* ファネル本体（画像帯） */}
        <div className="space-y-1.5">
          {rows.map((r) => {
            const leaking = r.rate < LEAK_THRESHOLD;
            return (
              <div key={r.key} className="flex justify-center">
                <div
                  className="relative"
                  style={{ width: r.w, height: BAND_H }}
                  title={`${r.name}：通過率 ${Math.round(r.rate * 100)}%`}
                >
                  <Image
                    src={r.img}
                    alt={`${r.name}（${r.sub}）`}
                    width={r.w}
                    height={BAND_H}
                    className="h-full w-full select-none"
                    style={
                      leaking
                        ? { filter: "saturate(0.35) opacity(0.55)" }
                        : undefined
                    }
                  />
                  {/* 通過率 */}
                  <span
                    className="tnum absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold"
                    style={{ color: leaking ? "#A32D2D" : r.text }}
                  >
                    {Math.round(r.rate * 100)}%
                  </span>
                  {/* 漏れマーク */}
                  {leaking && (
                    <Image
                      src="/funnel/leak-pipe.png"
                      alt="漏れています"
                      width={30}
                      height={30}
                      className="absolute -right-9 top-1/2 -translate-y-1/2 animate-pulse"
                      title="ここでお客さんが漏れています"
                    />
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* 成果タンク（溜まった水＝ファン） */}
        <div className="mx-auto mt-6 max-w-xl">
          <div className="flex items-end gap-4">
            <Image
              src="/funnel/water-mascot.png"
              alt="水のマスコット"
              width={96}
              height={96}
              className="shrink-0 drop-shadow-sm"
            />
            <div className="flex-1">
              <div className="mb-1 flex items-baseline justify-between">
                <span className="text-sm font-bold text-foreground">溜まった成果（ファン）</span>
                <span className="tnum text-2xl font-bold text-primary">{fill}%</span>
              </div>
              <div className="relative h-7 overflow-hidden rounded-full bg-surface-2">
                <div
                  className="absolute bottom-0 left-0 top-0 rounded-full transition-[width] duration-1000 ease-out"
                  style={{ width: `${fill}%`, background: "linear-gradient(90deg,#85B7EB,#5DCAA5)" }}
                />
              </div>
              <p className="mt-1.5 text-xs text-muted">
                各段階の漏れをふさぐほど、水（成果）が溜まっていきます。
              </p>
            </div>
          </div>
        </div>

        {/* 一番の漏れ＋対策導線 */}
        {worst.rate < LEAK_THRESHOLD && (
          <div className="mx-auto mt-5 flex max-w-xl flex-col gap-3 rounded-2xl border border-bad/30 bg-bad-weak/40 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm leading-relaxed text-foreground">
              いま一番漏れているのは{" "}
              <span className="font-bold" style={{ color: worst.text }}>
                「{worst.name}（{worst.sub}）」
              </span>
              。ここを直すと成果が大きく伸びます。
            </p>
            <Link
              href="/chat"
              className="inline-flex min-h-10 shrink-0 items-center justify-center gap-1.5 rounded-xl bg-primary px-4 text-sm font-bold text-white transition-colors hover:bg-primary/90"
            >
              対策を相談する
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

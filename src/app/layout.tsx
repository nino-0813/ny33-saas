import type { Metadata } from "next";
import { Noto_Sans_JP, Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

// UXBooster 風ダッシュボード用（ラテン・数字）
const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist",
  display: "swap",
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
  display: "swap",
});

const notoSansJP = Noto_Sans_JP({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-sans-app",
  display: "swap",
});

export const metadata: Metadata = {
  title: "NY33 Company Dock — 会社の定期健康診断プラットフォーム",
  description:
    "地方企業の利益を増やす。売上・SEO・MEO・SNS・LINEを一元化し、会社健康度をスコア化。AIが改善を提案します。",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="ja"
      className={`${notoSansJP.variable} ${geist.variable} ${geistMono.variable} h-full`}
    >
      <body className="min-h-full">{children}</body>
    </html>
  );
}

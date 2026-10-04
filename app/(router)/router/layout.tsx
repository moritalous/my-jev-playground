import type { Metadata } from "next";
import type { ReactNode } from "react";
import { SiteNav } from "@/components/common/site-nav";
import "./globals.css";

export const metadata: Metadata = {
  title: "問い合わせ振り分け",
  description:
    "お客様の問い合わせを Jev（TypeSafe）1回で分類し、確信度としきい値で自動対応・確認・人間に振り分けるデモ。",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ja">
      <body>
        <SiteNav current="router" />
        {children}
      </body>
    </html>
  );
}

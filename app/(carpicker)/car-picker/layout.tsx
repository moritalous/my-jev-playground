import type { Metadata } from "next";
import type { ReactNode } from "react";
import { SiteNav } from "@/components/common/site-nav";
import "./globals.css";

export const metadata: Metadata = {
  title: "ソラカー Car Picker",
  description:
    "自然文の要望から、ソラカーの車種・グレード・色・オプションをおすすめ順に提案する検証用アプリ（Jev 投機的ファンアウト）",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ja">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        {/* biome-ignore lint/style/noHeadElement: loads an external font in the App Router head */}
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Noto+Emoji&text=%F0%9F%9A%97%F0%9F%9A%99%F0%9F%9A%90&display=block"
        />
      </head>
      <body>
        <SiteNav current="carpicker" />
        {children}
      </body>
    </html>
  );
}

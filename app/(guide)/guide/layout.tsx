import type { Metadata } from "next";
import { SiteNav } from "@/components/common/site-nav";
import "./globals.css";

export const metadata: Metadata = {
  title: "Jev の使い方（やさしい解説）",
  description:
    "文章を書かない超高速の判定係「Jev」とは何か、4つのサンプルアプリでどう使っているかを、たとえ話でやさしく解説します。",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body>
        <SiteNav current="guide" />
        {children}
      </body>
    </html>
  );
}

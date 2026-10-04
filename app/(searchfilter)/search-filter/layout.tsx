import type { Metadata } from "next";
import { SiteNav } from "@/components/common/site-nav";
import "./globals.css";

export const metadata: Metadata = {
  title: "探してるものだけ表示",
  description:
    "Amazon の検索結果に混ざる、探していない商品を Jev（TypeSafe）が見分けて、探しているものだけを残すデモ。",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body>
        <SiteNav current="searchfilter" />
        {children}
      </body>
    </html>
  );
}

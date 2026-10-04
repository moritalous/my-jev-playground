import type { Metadata } from "next";
import { SiteNav } from "@/components/common/site-nav";
import "./globals.css";

export const metadata: Metadata = {
  title: "今夜なに作る？",
  description: "自由入力から、今夜の献立（主菜・副菜・汁物）をJevが選びます。",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body>
        <SiteNav current="dinner" />
        {children}
      </body>
    </html>
  );
}

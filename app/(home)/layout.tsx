import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "my-jev-playground",
  description:
    "TypeSafe AI の System One モデル Jev を使ったサンプルアプリ集。",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}

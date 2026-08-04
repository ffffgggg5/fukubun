import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "復文 - 英語学習アプリ",
  description: "復文学習法を毎日続けるためのアプリ",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ja" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}

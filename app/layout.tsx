import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ChronoBrewery Photo Live",
  description: "ChronoBrewery 活动图片直播平台"
};

type RootLayoutProps = {
  children: React.ReactNode;
};

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}

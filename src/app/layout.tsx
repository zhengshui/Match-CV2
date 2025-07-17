import "~/styles/globals.css";

import { type Metadata } from "next";
import { Geist } from "next/font/google";
import { SessionProvider } from "next-auth/react";

export const metadata: Metadata = {
  title: "简历匹配 CV2 - AI智能招聘平台",
  description: "基于人工智能的简历分析与候选人岗位匹配平台，提供智能简历解析、多维度匹配评分、批量处理和筛选推荐功能",
  keywords: "AI招聘,简历匹配,人工智能,招聘平台,简历分析,候选人筛选",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
};

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
});

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN" className={`${geist.variable} scroll-smooth`}>
      <body className="antialiased">
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  );
}

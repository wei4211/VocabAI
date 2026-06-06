import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "react-hot-toast";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "VocabAI - AI 智慧英文單字學習",
  description: "用 AI 加速你的英文單字學習，智慧複習、每日測驗、間隔記憶",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-TW" suppressHydrationWarning>
      <body className={`${inter.className} min-h-screen bg-gray-50 dark:bg-gray-950`}>
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3000,
            style: { borderRadius: "12px", fontFamily: inter.style.fontFamily },
          }}
        />
      </body>
    </html>
  );
}

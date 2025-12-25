import type { Metadata } from "next";
import type React from "react";
import { Manrope, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const manrope = Manrope({ subsets: ["latin"], variable: "--font-sans" });
const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: "Thường Thành Education- Quản lý trung tâm dạy thêm",
  description:
    "Hệ thống quản lý trung tâm dạy thêm hiệu quả với dashboard cho học sinh, giáo viên, phụ huynh và quản trị viên",
  generator: "v0.app",
  icons: {
    icon: [
      {
        url: "/icon-light-32x32.png",
        media: "(prefers-color-scheme: light)",
      },
      {
        url: "/icon-dark-32x32.png",
        media: "(prefers-color-scheme: dark)",
      },
      {
        url: "/icon.svg",
        type: "image/svg+xml",
      },
    ],
    apple: "/apple-icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <body
        className={`${manrope.className} ${jetbrainsMono.className} font-sans antialiased`}
      >
        {children}
      </body>
    </html>
  );
}

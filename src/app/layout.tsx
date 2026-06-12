import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], display: "swap" });

export const metadata: Metadata = {
  title: "Bolão da Copa 2026 🏆",
  description: "O bolão dos amigos da Copa do Mundo 2026. Quem errar mais paga o Busger!",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <head>
        <link rel="icon" href="/2026_FIFA_World_Cup_logo.svg.webp" type="image/webp" />
        <link rel="apple-touch-icon" href="/2026_FIFA_World_Cup_logo.svg.webp" />
      </head>
      <body className={inter.className}>{children}</body>
    </html>
  );
}

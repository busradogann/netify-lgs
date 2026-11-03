import type { Metadata } from "next";
import { Suspense } from "react";
import { Geist, Geist_Mono } from "next/font/google";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { ServerUserProvider } from "@/lib/server-auth";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Netify LGS — Sıralamana Göre Lise Bul",
    template: "%s | Netify LGS",
  },
  description:
    "LGS sıralama ve puanına göre uygun liseleri bul, karşılaştır, hedef analizi yap. Puan hesaplama, okul eşleştirme ve alıştırma — hepsi bir arada.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="tr"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <Suspense>
          <ServerUserProvider>
            <Header />
            <main className="flex-1">{children}</main>
            <Footer />
          </ServerUserProvider>
        </Suspense>
      </body>
    </html>
  );
}

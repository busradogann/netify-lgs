"use client";

import Link from "next/link";
import { Calculator, School, Target, BookOpen, Lock } from "lucide-react";
import { useUser } from "@/lib/user-context";

const features = [
  {
    icon: Calculator,
    title: "Puan Hesapla",
    description: "6 ders netini gir, tahmini LGS puanını anında gör",
    href: "/calculate",
    color: "bg-indigo-50 text-indigo-600",
    studentOnly: false,
  },
  {
    icon: School,
    title: "Okul Bul",
    description: "Sıralamana göre uygun liseleri keşfet, filtrele",
    href: "/schools",
    color: "bg-emerald-50 text-emerald-600",
    studentOnly: false,
  },
  {
    icon: Target,
    title: "Hedef Analizi",
    description: "Hedef okuluna kaç net kaldığını öğren",
    href: "/schools",
    color: "bg-amber-50 text-amber-600",
    studentOnly: false,
  },
  {
    icon: BookOpen,
    title: "Alıştırma & Deneme",
    description: "Ders bazlı sorularla pratik yap veya 90 soruluk deneme sınavına gir",
    href: "/practice",
    color: "bg-rose-50 text-rose-600",
    studentOnly: true,
  },
];

export default function HomePage() {
  const { profile } = useUser();
  const isParent = profile?.role === "ebeveyn";

  return (
    <div className="mx-auto max-w-5xl px-4">
      <section className="py-16 text-center sm:py-24">
        <h1 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-5xl">
          Sıralamana göre
          <span className="bg-gradient-to-r from-primary to-indigo-400 bg-clip-text text-transparent">
            {" "}lise bul
          </span>
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-base text-muted sm:text-lg">
          Netlerini gir, puanını hesapla, sana uygun liseleri anında gör.
          Karşılaştır, hedef belirle, alıştırma yap — tek yerden.
        </p>
        <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/calculate"
            className="w-full rounded-xl bg-primary px-8 py-3.5 text-sm font-semibold text-white shadow-lg shadow-primary/25 transition-all hover:bg-primary-dark hover:shadow-xl sm:w-auto"
          >
            Puan Hesapla
          </Link>
          <Link
            href="/schools"
            className="w-full rounded-xl border border-border bg-card px-8 py-3.5 text-sm font-semibold text-foreground transition-colors hover:bg-primary/5 sm:w-auto"
          >
            Okul Ara
          </Link>
        </div>
      </section>

      <section className="grid gap-4 pb-16 sm:grid-cols-2">
        {features.map((f) => {
          const disabled = f.studentOnly && isParent;
          if (disabled) {
            return (
              <div
                key={f.title}
                className="relative rounded-2xl border border-border bg-card p-6 opacity-50"
              >
                <div className={`inline-flex rounded-xl p-3 ${f.color}`}>
                  <f.icon className="h-5 w-5" />
                </div>
                <h3 className="mt-4 font-semibold text-foreground">{f.title}</h3>
                <p className="mt-1 text-sm text-muted">{f.description}</p>
                <span className="mt-3 inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 text-[10px] font-semibold text-amber-700">
                  <Lock className="h-3 w-3" />
                  Öğrencilere özel
                </span>
              </div>
            );
          }
          return (
            <Link
              key={f.title}
              href={f.href}
              className="group rounded-2xl border border-border bg-card p-6 transition-all hover:border-primary/30 hover:shadow-md"
            >
              <div className={`inline-flex rounded-xl p-3 ${f.color}`}>
                <f.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-4 font-semibold text-foreground">{f.title}</h3>
              <p className="mt-1 text-sm text-muted">{f.description}</p>
            </Link>
          );
        })}
      </section>
    </div>
  );
}

"use client";

import { Lock } from "lucide-react";
import Link from "next/link";
import { useUser } from "@/lib/user-context";

export default function ParentGate({ children }: { children: React.ReactNode }) {
  const { loading, profile } = useUser();

  if (loading) return null;

  if (profile?.role === "ebeveyn") {
    return (
      <div className="mx-auto max-w-md px-4 py-24 text-center">
        <div className="mx-auto mb-4 inline-flex rounded-2xl bg-amber-50 p-3">
          <Lock className="h-6 w-6 text-amber-600" />
        </div>
        <h1 className="text-xl font-bold text-foreground">
          Bu bölüm öğrencilere özeldir
        </h1>
        <p className="mt-2 text-sm text-muted">
          Alıştırma ve deneme sınavları yalnızca öğrenci hesaplarına açıktır.
          Profil ayarlarından hesap türünü değiştirebilirsiniz.
        </p>
        <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/profile"
            className="rounded-xl bg-primary px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-dark"
          >
            Profil Ayarları
          </Link>
          <Link
            href="/"
            className="rounded-xl border border-border px-6 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-primary/5"
          >
            Ana Sayfa
          </Link>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

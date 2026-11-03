import type { Metadata } from "next";
import Link from "next/link";
import { Calculator, History } from "lucide-react";
import ScoreCalculator from "@/components/calculator/ScoreCalculator";

export const metadata: Metadata = {
  title: "Puan Hesapla",
  description:
    "LGS net ve puan hesaplama aracı. 6 ders netini gir, tahmini LGS puanını anında gör.",
};

export default function HesaplaPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <div className="mb-8 text-center">
        <div className="mx-auto mb-4 inline-flex rounded-2xl bg-indigo-50 p-3">
          <Calculator className="h-6 w-6 text-indigo-600" />
        </div>
        <h1 className="text-2xl font-bold text-foreground sm:text-3xl">
          LGS Puan Hesapla
        </h1>
        <p className="mt-2 text-sm text-muted">
          Ders netlerini gir, tahmini LGS puanını anında gör.
        </p>
        <Link
          href="/calculate/history"
          className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary transition-colors hover:bg-primary/20"
        >
          <History className="h-3.5 w-3.5" />
          Puan Geçmişi
        </Link>
      </div>

      <ScoreCalculator />
    </div>
  );
}

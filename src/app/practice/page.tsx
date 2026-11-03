import type { Metadata } from "next";
import { BookOpen, FileText } from "lucide-react";
import Link from "next/link";
import QuizRunner from "@/components/practice/QuizRunner";
import ParentGate from "@/components/practice/ParentGate";

export const metadata: Metadata = {
  title: "Alıştırma",
  description:
    "LGS'ye hazırlık soruları. Rastgele sorularla pratik yap, eksiklerini gör.",
};

export default function PracticePage() {
  return (
    <ParentGate>
      <div className="mx-auto max-w-2xl px-4 py-8">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 inline-flex rounded-2xl bg-rose-50 p-3">
            <BookOpen className="h-6 w-6 text-rose-600" />
          </div>
          <h1 className="text-2xl font-bold text-foreground sm:text-3xl">
            Alıştırma Yap
          </h1>
          <p className="mt-2 text-sm text-muted">
            Rastgele sorularla pratik yap, eksiklerini keşfet.
          </p>
        </div>

        <Link
          href="/practice/exam"
          className="mb-6 flex items-center justify-between rounded-2xl border border-indigo-200 bg-indigo-50 p-5 transition-all hover:border-indigo-300 hover:shadow-md"
        >
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-indigo-100 p-2.5">
              <FileText className="h-5 w-5 text-indigo-600" />
            </div>
            <div>
              <p className="font-semibold text-indigo-900">Deneme Sınavı</p>
              <p className="text-xs text-indigo-600">90 soru · 155 dakika · Gerçek LGS formatı</p>
            </div>
          </div>
          <span className="text-sm font-medium text-indigo-600">Başla →</span>
        </Link>

        <QuizRunner />
      </div>
    </ParentGate>
  );
}

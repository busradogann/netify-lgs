import type { Metadata } from "next";
import { FileText } from "lucide-react";
import DenemeExam from "@/components/practice/DenemeExam";
import ParentGate from "@/components/practice/ParentGate";

export const metadata: Metadata = {
  title: "Deneme Sınavı",
  description: "90 soruluk LGS formatında deneme sınavı. Gerçek sınav deneyimi yaşa.",
};

export default function DenemeExamPage() {
  return (
    <ParentGate>
      <div className="mx-auto max-w-3xl px-4 py-8">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 inline-flex rounded-2xl bg-indigo-50 p-3">
            <FileText className="h-6 w-6 text-indigo-600" />
          </div>
          <h1 className="text-2xl font-bold text-foreground sm:text-3xl">
            Deneme Sınavı
          </h1>
          <p className="mt-2 text-sm text-muted">
            90 soru · 155 dakika · Gerçek LGS formatı
          </p>
        </div>

        <DenemeExam />
      </div>
    </ParentGate>
  );
}

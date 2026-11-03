import type { Metadata } from "next";
import { Suspense } from "react";
import { School } from "lucide-react";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import SchoolSearch from "@/components/schools/SchoolSearch";
import type { SchoolWithScore } from "@/types/database";

export const metadata: Metadata = {
  title: "Okul Bul",
  description:
    "LGS sıralamanıza göre yerleşebileceğiniz liseleri bulun. Fen lisesi, Anadolu lisesi ve daha fazlası.",
};

async function SchoolListContent() {
  const supabase = await createServerSupabaseClient();

  const { data: schools } = await supabase
    .from("schools")
    .select("*")
    .order("name");

  const { data: allScores } = await supabase
    .from("placement_scores")
    .select("*")
    .order("year", { ascending: true });

  const scoresList = allScores ?? [];
  const years = [2024, 2025, 2026];

  const schoolsWithScores: SchoolWithScore[] = (schools ?? []).map((school) => {
    const schoolScores = scoresList.filter((s) => s.school_id === school.id);
    const latest = schoolScores.find((s) => s.year === years[years.length - 1]) ?? null;
    return {
      ...school,
      placement: latest,
      placements: schoolScores,
    };
  });

  return <SchoolSearch initialSchools={schoolsWithScores} years={years} />;
}

function LoadingSkeleton() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="rounded-2xl border border-border bg-card p-5">
        <div className="flex gap-3">
          <div className="h-12 flex-1 rounded-xl bg-border" />
          <div className="h-12 flex-1 rounded-xl bg-border" />
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:hidden">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-40 rounded-2xl border border-border bg-card" />
        ))}
      </div>
      <div className="hidden overflow-hidden rounded-2xl border border-border bg-card lg:block">
        <div className="h-10 border-b border-border bg-background/50" />
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-14 border-b border-border last:border-0" />
        ))}
      </div>
    </div>
  );
}

export default function SchoolsPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-8 text-center">
        <div className="mx-auto mb-4 inline-flex rounded-2xl bg-emerald-50 p-3">
          <School className="h-6 w-6 text-emerald-600" />
        </div>
        <h1 className="text-2xl font-bold text-foreground sm:text-3xl">
          Sıralamana Göre Okul Bul
        </h1>
        <p className="mt-2 text-sm text-muted">
          Sıralamanı gir, sana uygun liseleri anında gör.
        </p>
      </div>

      <Suspense fallback={<LoadingSkeleton />}>
        <SchoolListContent />
      </Suspense>
    </div>
  );
}

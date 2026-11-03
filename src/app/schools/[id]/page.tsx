import type { Metadata } from "next";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import {
  createServerSupabaseClient,
  createPublicSupabaseClient,
} from "@/lib/supabase-server";
import { SCHOOL_TYPE_LABELS } from "@/lib/utils";
import SchoolDetail from "@/components/schools/SchoolDetail";
import type { SchoolWithScore } from "@/types/database";

export async function generateMetadata(
  props: PageProps<"/schools/[id]">
): Promise<Metadata> {
  "use cache";
  const { id } = await props.params;
  const supabase = createPublicSupabaseClient();
  const { data: school } = await supabase
    .from("schools")
    .select("*")
    .eq("id", id)
    .single();

  if (!school) return { title: "Okul Bulunamadı" };

  const typeLabel = SCHOOL_TYPE_LABELS[school.type] ?? school.type;
  return {
    title: school.name,
    description: `${school.name} — ${typeLabel}, ${school.district}/${school.city}. Taban sıralama, puan, kontenjan ve yıllık trend bilgileri.`,
  };
}

async function SchoolDetailContent({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await connection();
  const { id } = await params;
  const supabase = await createServerSupabaseClient();

  const { data: school } = await supabase
    .from("schools")
    .select("*")
    .eq("id", id)
    .single();

  if (!school) notFound();

  const { data: latestScore } = await supabase
    .from("placement_scores")
    .select("*")
    .eq("school_id", id)
    .eq("year", 2026)
    .single();

  const { data: history } = await supabase
    .from("placement_scores")
    .select("*")
    .eq("school_id", id)
    .order("year", { ascending: true });

  const schoolWithScore: SchoolWithScore = {
    ...school,
    placement: latestScore ?? null,
  };

  return <SchoolDetail school={schoolWithScore} history={history ?? []} />;
}

function LoadingSkeleton() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="h-4 w-32 rounded bg-border" />
      <div className="rounded-2xl border border-border bg-card p-6">
        <div className="h-6 w-48 rounded bg-border" />
        <div className="mt-3 h-8 w-64 rounded bg-border" />
        <div className="mt-6 grid gap-4 sm:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-20 rounded-xl bg-border" />
          ))}
        </div>
      </div>
    </div>
  );
}

export default function SchoolDetailPage(
  props: PageProps<"/schools/[id]">
) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <Suspense fallback={<LoadingSkeleton />}>
        <SchoolDetailContent params={props.params} />
      </Suspense>
    </div>
  );
}

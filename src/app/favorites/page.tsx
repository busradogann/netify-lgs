import type { Metadata } from "next";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { Heart } from "lucide-react";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import FavoritesList from "@/components/favorites/FavoritesList";
import type { SchoolWithScore } from "@/types/database";

export const metadata: Metadata = {
  title: "Favoriler",
  description:
    "Favori okullarını yönet ve karşılaştır. En fazla 4 okulu yan yana incele.",
};

async function FavoritesContent() {
  await connection();
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: favorites } = await supabase
    .from("favorites")
    .select("school_id")
    .eq("user_id", user.id);

  const favoriteIds = (favorites ?? []).map((f) => f.school_id);

  let schools: SchoolWithScore[] = [];
  if (favoriteIds.length > 0) {
    const { data: schoolRows } = await supabase
      .from("schools")
      .select("*")
      .in("id", favoriteIds);

    const { data: scores } = await supabase
      .from("placement_scores")
      .select("*")
      .in("school_id", favoriteIds)
      .eq("year", 2026);

    schools = (schoolRows ?? []).map((school) => ({
      ...school,
      placement: scores?.find((s) => s.school_id === school.id) ?? null,
    }));
  }

  return <FavoritesList initialSchools={schools} />;
}

export default function FavoritesPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="mb-8 text-center">
        <div className="mx-auto mb-4 inline-flex rounded-2xl bg-pink-50 p-3">
          <Heart className="h-6 w-6 text-pink-600" />
        </div>
        <h1 className="text-2xl font-bold text-foreground sm:text-3xl">
          Favori Okullarım
        </h1>
        <p className="mt-2 text-sm text-muted">
          Beğendiğin okulları karşılaştır, hedefini belirle.
        </p>
      </div>

      <Suspense
        fallback={
          <div className="animate-pulse space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-32 rounded-2xl border border-border bg-card" />
            ))}
          </div>
        }
      >
        <FavoritesContent />
      </Suspense>
    </div>
  );
}

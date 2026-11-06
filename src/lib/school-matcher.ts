import { createClient } from "@/lib/supabase";
import { getDifficultyBadge } from "@/lib/constants";
import type { SchoolWithYearlyScores } from "@/types/database";

const BADGE_ORDER = ["Rahat gelir", "Gelir", "Sınırda", "Zor", "Çok Zor"];

export async function fetchMatchingSchools(
  score: number
): Promise<SchoolWithYearlyScores[]> {
  const supabase = createClient();

  const { data: scores2026 } = await supabase
    .from("placement_scores")
    .select("*")
    .eq("year", 2026)
    .gte("min_score", score - 50)
    .lte("min_score", score + 30)
    .order("min_score", { ascending: false })
    .limit(500);

  if (!scores2026 || scores2026.length === 0) return [];

  const schoolIds = [...new Set(scores2026.map((s: any) => s.school_id))];

  const [{ data: schools }, { data: allScores }] = await Promise.all([
    supabase.from("schools").select("*").in("id", schoolIds),
    supabase
      .from("placement_scores")
      .select("*")
      .in("school_id", schoolIds)
      .order("year", { ascending: true })
      .limit(5000),
  ]);

  const merged: SchoolWithYearlyScores[] = (schools ?? []).map(
    (school: any) => {
      const schoolScores = (allScores ?? []).filter(
        (s: any) => s.school_id === school.id
      );
      const yearlyScores: Record<number, number | null> = {};
      for (const s of schoolScores) yearlyScores[s.year] = s.min_score;
      return {
        ...school,
        placement:
          scores2026.find((s: any) => s.school_id === school.id) ?? null,
        yearlyScores,
      };
    }
  );

  merged.sort((a, b) => {
    const ba = getDifficultyBadge(score, a.placement?.min_score ?? 0);
    const bb = getDifficultyBadge(score, b.placement?.min_score ?? 0);
    const diff =
      BADGE_ORDER.indexOf(ba.label) - BADGE_ORDER.indexOf(bb.label);
    if (diff !== 0) return diff;
    return (b.placement?.min_score ?? 0) - (a.placement?.min_score ?? 0);
  });

  return merged;
}

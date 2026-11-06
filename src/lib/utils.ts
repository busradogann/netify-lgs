export function formatRanking(ranking: number | null | undefined): string {
  if (ranking == null) return "—";
  return ranking.toLocaleString("tr-TR");
}

export function formatScore(score: number | null | undefined): string {
  if (score == null) return "—";
  return score.toLocaleString("tr-TR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export const SCHOOL_TYPE_LABELS: Record<string, string> = {
  fen: "Fen Lisesi",
  anadolu: "Anadolu Lisesi",
  sosyal: "Sosyal Bilimler",
  imam_hatip: "İmam Hatip",
  meslek: "Meslek Lisesi",
};

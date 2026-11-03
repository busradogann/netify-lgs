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

export function cn(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(" ");
}

export const SCHOOL_TYPE_LABELS: Record<string, string> = {
  fen: "Fen Lisesi",
  anadolu: "Anadolu Lisesi",
  sosyal: "Sosyal Bilimler",
  imam_hatip: "İmam Hatip",
  meslek: "Meslek Lisesi",
};

export function getStatusInfo(rankingDiff: number): {
  label: string;
  color: string;
  bg: string;
} {
  if (rankingDiff > 5000) {
    return { label: "Güvenli", color: "text-emerald-600", bg: "bg-emerald-50" };
  }
  if (rankingDiff >= 0) {
    return { label: "Dengeli", color: "text-amber-600", bg: "bg-amber-50" };
  }
  return { label: "Riskli", color: "text-red-600", bg: "bg-red-50" };
}

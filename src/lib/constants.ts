import type { Subject } from "@/types/database";

export const TYPE_STYLES: Record<string, string> = {
  fen: "bg-purple-100 text-purple-700",
  anadolu: "bg-blue-100 text-blue-700",
  sosyal: "bg-amber-100 text-amber-700",
  imam_hatip: "bg-teal-100 text-teal-700",
  meslek: "bg-gray-100 text-gray-700",
};

export const SUBJECT_LABELS: Record<Subject, string> = {
  turkce: "Türkçe",
  matematik: "Matematik",
  fen: "Fen Bilimleri",
  inkilap: "İnkılap Tarihi",
  din: "Din Kültürü",
  yabanciDil: "Yabancı Dil",
};

export const SUBJECT_COLORS: Record<Subject, string> = {
  turkce: "bg-blue-500",
  matematik: "bg-indigo-500",
  fen: "bg-emerald-500",
  inkilap: "bg-amber-500",
  din: "bg-rose-500",
  yabanciDil: "bg-purple-500",
};

export function getDifficultyBadge(userScore: number, schoolScore: number) {
  const diff = userScore - schoolScore;
  if (diff >= 10) return { label: "Rahat gelir", cls: "bg-emerald-100 text-emerald-700" };
  if (diff >= 3) return { label: "Gelir", cls: "bg-green-100 text-green-700" };
  if (diff >= -3) return { label: "Sınırda", cls: "bg-amber-100 text-amber-700" };
  if (diff >= -15) return { label: "Zor", cls: "bg-orange-100 text-orange-700" };
  return { label: "Çok Zor", cls: "bg-red-100 text-red-700" };
}

export function getMatchStatus(userRanking: number, minRanking: number) {
  const diff = minRanking - userRanking;
  if (diff > minRanking * 0.15) {
    return { label: "Rahat", className: "bg-emerald-100 text-emerald-700" };
  }
  if (diff >= 0) {
    return { label: "Sınırda", className: "bg-amber-100 text-amber-700" };
  }
  return { label: "Zor", className: "bg-red-100 text-red-700" };
}

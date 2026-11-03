"use client";

import { useState } from "react";
import {
  MapPin,
  Users,
  TrendingUp,
  Award,
  ChevronLeft,
  ChevronDown,
  Target,
} from "lucide-react";
import Link from "next/link";
import type { SchoolWithScore, PlacementScore } from "@/types/database";
import { SCHOOL_TYPE_LABELS } from "@/lib/utils";
import { formatRanking, formatScore } from "@/lib/utils";
import FavoriteButton from "@/components/shared/FavoriteButton";

const TYPE_STYLES: Record<string, string> = {
  fen: "bg-purple-100 text-purple-700",
  anadolu: "bg-blue-100 text-blue-700",
  sosyal: "bg-amber-100 text-amber-700",
  imam_hatip: "bg-teal-100 text-teal-700",
  meslek: "bg-gray-100 text-gray-700",
};

interface SchoolDetailProps {
  school: SchoolWithScore;
  history: PlacementScore[];
}

export default function SchoolDetail({ school, history }: SchoolDetailProps) {
  const [userScore, setUserScore] = useState("");
  const [showAnalysis, setShowAnalysis] = useState(false);
  const placement = school.placement;
  const parsedScore = userScore ? Number(userScore.replace(",", ".")) : undefined;

  const scoreDiff =
    parsedScore != null && placement?.min_score != null
      ? parsedScore - placement.min_score
      : null;

  const maxScore = Math.max(...history.map((h) => h.min_score ?? 0), 1);

  return (
    <div className="space-y-6">
      <Link
        href="/schools"
        className="inline-flex items-center gap-1 text-sm text-muted transition-colors hover:text-foreground"
      >
        <ChevronLeft className="h-4 w-4" />
        Okullara Dön
      </Link>

      <div className="rounded-2xl border border-border bg-card p-6">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`rounded-full px-3 py-1 text-xs font-semibold ${TYPE_STYLES[school.type] ?? TYPE_STYLES.meslek}`}
          >
            {SCHOOL_TYPE_LABELS[school.type] ?? school.type}
          </span>
        </div>
        <div className="mt-3 flex items-center gap-2">
          <h1 className="text-xl font-bold text-foreground sm:text-2xl">
            {school.name}
          </h1>
          <FavoriteButton schoolId={school.id} size="md" />
        </div>
        <div className="mt-2 flex items-center gap-1 text-sm text-muted">
          <MapPin className="h-4 w-4" />
          <span>
            {school.district}, {school.city}
          </span>
        </div>

        {placement && (
          <div className="mt-6 grid gap-4 sm:grid-cols-4">
            <StatCard
              icon={<TrendingUp className="h-4 w-4 text-primary" />}
              label="Taban Sıralama"
              value={formatRanking(placement.min_ranking!)}
            />
            <StatCard
              icon={<Award className="h-4 w-4 text-emerald-500" />}
              label="Taban Puan"
              value={formatScore(placement.min_score!)}
            />
            <StatCard
              icon={<Users className="h-4 w-4 text-amber-500" />}
              label="Kontenjan"
              value={String(placement.quota)}
            />
            <StatCard
              icon={<Users className="h-4 w-4 text-blue-500" />}
              label="Yerleşen"
              value={String(placement.placed)}
              sub={
                placement.quota
                  ? `%${Math.round((placement.placed! / placement.quota) * 100)}`
                  : undefined
              }
            />
          </div>
        )}

        <div className="mt-5 border-t border-border pt-4">
          <div className="flex items-center gap-3">
            <div className="flex-1 sm:max-w-xs">
              <input
                type="text"
                inputMode="decimal"
                value={userScore}
                onChange={(e) => { setUserScore(e.target.value); setShowAnalysis(true); }}
                onFocus={(e) => { e.target.select(); setShowAnalysis(true); }}
                placeholder="Tahmini puanını gir..."
                className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm font-medium text-foreground outline-none transition-colors placeholder:text-muted focus:border-primary"
              />
            </div>
            <p className="hidden text-xs text-muted sm:block">
              Tahmini LGS puanını gir, bu okula ne kadar yakın olduğunu gör.
            </p>
          </div>

          {scoreDiff !== null && (
            <div className="mt-4 rounded-xl bg-background p-4">
              {scoreDiff >= 10 ? (
                <>
                  <p className="text-sm text-emerald-600">
                    Bu okulun taban puanından{" "}
                    <span className="font-bold">
                      {scoreDiff.toFixed(2)} puan yüksektesin
                    </span>
                    .
                  </p>
                  <div className="mt-2">
                    <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                      Rahat gelir
                    </span>
                  </div>
                </>
              ) : scoreDiff >= 3 ? (
                <>
                  <p className="text-sm text-green-600">
                    Bu okulun taban puanından{" "}
                    <span className="font-bold">
                      {scoreDiff.toFixed(2)} puan yüksektesin
                    </span>
                    .
                  </p>
                  <div className="mt-2">
                    <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
                      Gelir
                    </span>
                  </div>
                </>
              ) : scoreDiff >= -3 ? (
                <>
                  <p className="text-sm text-amber-600">
                    Bu okulun taban puanıyla{" "}
                    <span className="font-bold">neredeyse eşitsin</span>
                    {" "}({scoreDiff >= 0 ? "+" : ""}{scoreDiff.toFixed(2)} puan).
                  </p>
                  <div className="mt-2">
                    <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
                      Sınırda
                    </span>
                  </div>
                </>
              ) : scoreDiff >= -15 ? (
                <>
                  <p className="text-sm text-orange-600">
                    Bu okulun taban puanından{" "}
                    <span className="font-bold">
                      {Math.abs(scoreDiff).toFixed(2)} puan düşüktesin
                    </span>
                    .
                  </p>
                  <div className="mt-2">
                    <span className="rounded-full bg-orange-100 px-3 py-1 text-xs font-semibold text-orange-700">
                      Zor
                    </span>
                  </div>
                </>
              ) : (
                <>
                  <p className="text-sm text-red-600">
                    Bu okulun taban puanından{" "}
                    <span className="font-bold">
                      {Math.abs(scoreDiff).toFixed(2)} puan düşüktesin
                    </span>
                    .
                  </p>
                  <div className="mt-2">
                    <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700">
                      Çok Zor
                    </span>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {history.length > 0 && (
        <div className="rounded-2xl border border-border bg-card p-6">
          <h2 className="mb-4 text-lg font-semibold text-foreground">
            Yıllık Trend
          </h2>
          <div className="space-y-3">
            {history.map((h) => {
              const barWidth = maxScore
                ? ((h.min_score ?? 0) / maxScore) * 100
                : 0;
              return (
                <div key={h.year} className="flex items-center gap-3">
                  <span className="w-12 text-sm font-medium text-muted">
                    {h.year}
                  </span>
                  <div className="relative h-6 flex-1 overflow-hidden rounded-lg bg-border">
                    <div
                      className="absolute inset-y-0 left-0 rounded-lg bg-gradient-to-r from-primary to-indigo-400 transition-all"
                      style={{ width: `${barWidth}%` }}
                    />
                    <span className="absolute inset-y-0 left-3 flex items-center text-xs font-semibold text-white">
                      {h.min_score?.toFixed(2)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs text-muted">
                  <th className="pb-2 pr-4 font-medium">Yıl</th>
                  <th className="pb-2 pr-4 font-medium">Taban Sıralama</th>
                  <th className="pb-2 pr-4 font-medium">Taban Puan</th>
                  <th className="pb-2 pr-4 font-medium">Kontenjan</th>
                  <th className="pb-2 font-medium">Yerleşen</th>
                </tr>
              </thead>
              <tbody>
                {history.map((h) => (
                  <tr
                    key={h.year}
                    className="border-b border-border/50 last:border-0"
                  >
                    <td className="py-2 pr-4 font-medium text-foreground">
                      {h.year}
                    </td>
                    <td className="py-2 pr-4 text-foreground">
                      {formatRanking(h.min_ranking!)}
                    </td>
                    <td className="py-2 pr-4 text-foreground">
                      {h.min_score?.toFixed(1)}
                    </td>
                    <td className="py-2 pr-4 text-foreground">{h.quota}</td>
                    <td className="py-2 text-foreground">{h.placed}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  sub,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="rounded-xl bg-background p-4">
      <div className="flex items-center gap-2">
        {icon}
        <p className="text-xs text-muted">{label}</p>
      </div>
      <p className="mt-1 text-lg font-bold text-foreground">
        {value}
        {sub && (
          <span className="ml-1 text-sm font-normal text-muted">{sub}</span>
        )}
      </p>
    </div>
  );
}

import Link from "next/link";
import { MapPin, Users, TrendingUp } from "lucide-react";
import type { SchoolWithScore } from "@/types/database";
import { formatRanking, SCHOOL_TYPE_LABELS } from "@/lib/utils";
import { TYPE_STYLES, getMatchStatus } from "@/lib/constants";
import FavoriteButton from "@/components/shared/FavoriteButton";

interface SchoolCardProps {
  school: SchoolWithScore;
  userRanking?: number;
  years?: number[];
}

export default function SchoolCard({ school, userRanking, years = [] }: SchoolCardProps) {
  const placement = school.placement;
  const placements = school.placements ?? [];
  const status =
    userRanking && placement?.min_ranking
      ? getMatchStatus(userRanking, placement.min_ranking)
      : null;

  return (
    <Link
      href={`/schools/${school.id}`}
      className="group block rounded-2xl border border-border bg-card p-5 transition-all hover:border-primary/30 hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`inline-block rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${TYPE_STYLES[school.type] ?? TYPE_STYLES.meslek}`}
            >
              {SCHOOL_TYPE_LABELS[school.type] ?? school.type}
            </span>
            {status && (
              <span
                className={`inline-block rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${status.className}`}
              >
                {status.label}
              </span>
            )}
          </div>
          <h3 className="mt-2 font-semibold text-foreground group-hover:text-primary">
            {school.name}
          </h3>
          <div className="mt-1 flex items-center gap-1 text-sm text-muted">
            <MapPin className="h-3.5 w-3.5" />
            <span>
              {school.district}, {school.city}
            </span>
          </div>
        </div>
        <FavoriteButton schoolId={school.id} />
      </div>

      {(placement || years.length > 0) && (
        <div className="mt-4 space-y-3">
          <div className="flex items-center gap-3">
            {placement?.min_ranking && (
              <div className="flex-1">
                <p className="text-xs text-muted">Sıralama</p>
                <p className="mt-0.5 flex items-center gap-1 text-sm font-semibold text-foreground">
                  <TrendingUp className="h-3.5 w-3.5 text-primary" />
                  {formatRanking(placement.min_ranking)}
                </p>
              </div>
            )}
            {placement?.quota && (
              <div className="flex-1">
                <p className="text-xs text-muted">Kontenjan</p>
                <p className="mt-0.5 flex items-center gap-1 text-sm font-semibold text-foreground">
                  <Users className="h-3.5 w-3.5 text-muted" />
                  {placement.quota}
                </p>
              </div>
            )}
          </div>
          {years.length > 0 && (
            <div>
              <p className="text-xs text-muted">Taban Puanları</p>
              <div className="mt-1 flex items-center gap-3">
                {years.map((year) => {
                  const p = placements.find((s) => s.year === year);
                  return (
                    <div key={year} className="text-center text-xs">
                      <span className="block text-muted">{year}</span>
                      <span className="block tabular-nums font-semibold text-foreground">
                        {p?.min_score ? p.min_score.toFixed(1) : "–"}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </Link>
  );
}

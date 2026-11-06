"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Search, SlidersHorizontal, X, ChevronLeft, ChevronRight, TrendingUp, MapPin } from "lucide-react";
import type { SchoolWithScore } from "@/types/database";
import { SCHOOL_TYPE_LABELS, formatRanking } from "@/lib/utils";
import { TYPE_STYLES, getMatchStatus } from "@/lib/constants";
import SchoolCard from "./SchoolCard";
import FavoriteButton from "@/components/shared/FavoriteButton";

const PAGE_SIZE = 20;

const SCHOOL_TYPES = Object.keys(SCHOOL_TYPE_LABELS);

interface SchoolSearchProps {
  initialSchools?: SchoolWithScore[];
  years?: number[];
}

export default function SchoolSearch({ initialSchools, years = [] }: SchoolSearchProps) {
  const [ranking, setRanking] = useState("");
  const [selectedType, setSelectedType] = useState<string>("");
  const [selectedCity, setSelectedCity] = useState<string>("");
  const [query, setQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);

  const cities = useMemo(
    () => [...new Set((initialSchools ?? []).map((s) => s.city))].sort(),
    [initialSchools]
  );

  const userRanking = ranking ? Number(ranking.replace(/\D/g, "")) : undefined;

  const filtered = useMemo(() => {
    const source = initialSchools ?? [];
    let results: SchoolWithScore[] = [...source];

    if (userRanking && userRanking > 0) {
      const margin = 0.3;
      results = results.filter((s) => {
        if (!s.placement?.min_ranking) return false;
        const low = userRanking * (1 - margin);
        const high = userRanking * (1 + margin);
        return s.placement.min_ranking >= low && s.placement.min_ranking <= high;
      });
    }

    if (selectedType) {
      results = results.filter((s) => s.type === selectedType);
    }

    if (selectedCity) {
      results = results.filter((s) => s.city === selectedCity);
    }

    if (query.trim()) {
      const q = query.trim().toLowerCase();
      results = results.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.district.toLowerCase().includes(q)
      );
    }

    results.sort((a, b) => {
      const ra = a.placement?.min_ranking ?? Infinity;
      const rb = b.placement?.min_ranking ?? Infinity;
      return ra - rb;
    });

    return results;
  }, [initialSchools, userRanking, selectedType, selectedCity, query]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const hasActiveFilters = !!selectedType || !!selectedCity;

  function handleRankingChange(value: string) {
    setPage(1);
    const digits = value.replace(/\D/g, "");
    if (digits === "") {
      setRanking("");
      return;
    }
    const num = Number(digits);
    if (num > 1_500_000) return;
    setRanking(num.toLocaleString("tr-TR"));
  }

  function clearFilters() {
    setSelectedType("");
    setSelectedCity("");
    setQuery("");
    setPage(1);
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-border bg-card p-5">
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="flex-1">
            <label
              htmlFor="ranking"
              className="mb-1.5 block text-sm font-medium text-foreground"
            >
              Sıralamanı Gir
            </label>
            <input
              id="ranking"
              type="text"
              inputMode="numeric"
              value={ranking}
              onChange={(e) => handleRankingChange(e.target.value)}
              onFocus={(e) => e.target.select()}
              placeholder="Örn: 15.000"
              className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm font-medium text-foreground outline-none transition-colors placeholder:text-muted focus:border-primary"
            />
          </div>
          <div className="flex-1">
            <label
              htmlFor="search"
              className="mb-1.5 block text-sm font-medium text-foreground"
            >
              Okul Ara
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
              <input
                id="search"
                type="text"
                value={query}
                onChange={(e) => { setQuery(e.target.value); setPage(1); }}
                placeholder="Okul adı veya ilçe..."
                className="w-full rounded-xl border border-border bg-background py-3 pl-10 pr-4 text-sm text-foreground outline-none transition-colors placeholder:text-muted focus:border-primary"
              />
            </div>
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-muted transition-colors hover:bg-primary/5 hover:text-foreground"
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            Filtreler
            {hasActiveFilters && (
              <span className="ml-1 rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-bold text-white">
                {(selectedType ? 1 : 0) + (selectedCity ? 1 : 0)}
              </span>
            )}
          </button>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1 text-sm text-muted hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
              Temizle
            </button>
          )}
        </div>

        {showFilters && (
          <div className="mt-3 space-y-3 border-t border-border pt-3">
            <div>
              <p className="mb-2 text-xs font-medium text-muted">Okul Türü</p>
              <div className="flex flex-wrap gap-2">
                {SCHOOL_TYPES.map((type) => (
                  <button
                    key={type}
                    onClick={() => {
                      setSelectedType(selectedType === type ? "" : type);
                      setPage(1);
                    }}
                    className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                      selectedType === type
                        ? "bg-primary text-white"
                        : "bg-background text-muted hover:bg-primary/5 hover:text-foreground"
                    }`}
                  >
                    {SCHOOL_TYPE_LABELS[type]}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="mb-2 text-xs font-medium text-muted">Şehir</p>
              <div className="flex flex-wrap gap-2">
                {cities.map((city) => (
                  <button
                    key={city}
                    onClick={() => {
                      setSelectedCity(selectedCity === city ? "" : city);
                      setPage(1);
                    }}
                    className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                      selectedCity === city
                        ? "bg-primary text-white"
                        : "bg-background text-muted hover:bg-primary/5 hover:text-foreground"
                    }`}
                  >
                    {city}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      <div>
        <p className="mb-3 text-sm text-muted">
          {filtered.length} okul bulundu
          {userRanking ? ` (sıralama: ${userRanking.toLocaleString("tr-TR")})` : ""}
          {totalPages > 1 && ` · Sayfa ${page}/${totalPages}`}
        </p>
        {paged.length > 0 ? (
          <>
            {/* Mobile: cards */}
            <div className="grid gap-4 sm:grid-cols-2 lg:hidden">
              {paged.map((school) => (
                <SchoolCard
                  key={school.id}
                  school={school}
                  userRanking={userRanking}
                  years={years}
                />
              ))}
            </div>

            {/* Desktop: table */}
            <div className="hidden lg:block">
              <div className="overflow-hidden rounded-2xl border border-border bg-card">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-border bg-background/50 text-xs font-medium text-muted">
                      <th className="py-3 pl-5 pr-3 font-medium">Okul</th>
                      <th className="px-3 py-3 font-medium">Konum</th>
                      <th className="px-3 py-3 font-medium text-center">Taban Puanları</th>
                      <th className="px-3 py-3 font-medium text-right whitespace-nowrap">Sıralama</th>
                      <th className="px-3 py-3 font-medium text-right whitespace-nowrap">Kontenjan</th>
                      {userRanking && <th className="px-3 py-3 font-medium text-center">Durum</th>}
                      <th className="py-3 pl-3 pr-4"><span className="sr-only">Favori</span></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {paged.map((school) => {
                      const placement = school.placement;
                      const placements = school.placements ?? [];
                      const matchStatus = userRanking && placement?.min_ranking
                        ? getMatchStatus(userRanking, placement.min_ranking)
                        : null;
                      return (
                        <tr key={school.id} className="group transition-colors hover:bg-primary/[0.03]">
                          <td className="max-w-[260px] py-3 pl-5 pr-3">
                            <Link href={`/schools/${school.id}`} className="block min-w-0">
                              <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold ${TYPE_STYLES[school.type] ?? TYPE_STYLES.meslek}`}>
                                {SCHOOL_TYPE_LABELS[school.type] ?? school.type}
                              </span>
                              <p className="mt-1 truncate font-medium text-foreground group-hover:text-primary">
                                {school.name}
                              </p>
                            </Link>
                          </td>
                          <td className="px-3 py-3 text-muted">
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3.5 w-3.5 shrink-0" />
                              <span className="truncate">{school.district}, {school.city}</span>
                            </span>
                          </td>
                          <td className="px-3 py-3">
                            <div className="flex items-center justify-end gap-4">
                              {years.map((year) => {
                                const p = placements.find((s) => s.year === year);
                                return (
                                  <div key={year} className="text-center text-xs">
                                    <span className="block text-muted">{year}</span>
                                    <span className="block tabular-nums font-semibold text-foreground">
                                      {p?.min_score ? p.min_score.toFixed(1) : <span className="font-normal text-muted">–</span>}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          </td>
                          <td className="whitespace-nowrap px-3 py-3 text-right">
                            {placement?.min_ranking ? (
                              <span className="inline-flex items-center gap-1 font-semibold text-foreground">
                                <TrendingUp className="h-3.5 w-3.5 text-primary" />
                                {formatRanking(placement.min_ranking)}
                              </span>
                            ) : (
                              <span className="text-muted">—</span>
                            )}
                          </td>
                          <td className="whitespace-nowrap px-3 py-3 text-right font-semibold text-foreground">
                            {placement?.quota ?? <span className="font-normal text-muted">—</span>}
                          </td>
                          {userRanking && (
                            <td className="px-3 py-3 text-center">
                              {matchStatus ? (
                                <span className={`inline-block rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${matchStatus.className}`}>
                                  {matchStatus.label}
                                </span>
                              ) : (
                                <span className="text-muted">—</span>
                              )}
                            </td>
                          )}
                          <td className="py-3 pl-3 pr-4">
                            <FavoriteButton schoolId={school.id} />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
            {totalPages > 1 && (
              <div className="mt-6 flex items-center justify-center gap-2">
                <button
                  onClick={() => { setPage((p) => Math.max(1, p - 1)); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                  disabled={page === 1}
                  className="flex items-center gap-1 rounded-lg border border-border px-3 py-2 text-sm font-medium text-muted transition-colors hover:bg-primary/5 hover:text-foreground disabled:opacity-30"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Önceki
                </button>
                <span className="px-3 text-sm font-semibold text-foreground">
                  {page} / {totalPages}
                </span>
                <button
                  onClick={() => { setPage((p) => Math.min(totalPages, p + 1)); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                  disabled={page === totalPages}
                  className="flex items-center gap-1 rounded-lg border border-border px-3 py-2 text-sm font-medium text-muted transition-colors hover:bg-primary/5 hover:text-foreground disabled:opacity-30"
                >
                  Sonraki
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="rounded-2xl border border-border bg-card py-16 text-center">
            <p className="text-muted">
              {userRanking
                ? "Bu sıralamaya uygun okul bulunamadı. Aralığı genişletmek için farklı bir sıralama deneyin."
                : "Sıralamanızı girerek size uygun okulları görün."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import Link from "next/link";
import { RotateCcw, MapPin, ChevronLeft, ChevronRight, ChevronDown, ChevronUp, School, Pencil, History } from "lucide-react";
import {
  type LGSInput,
  LGS_LIMITS,
  calculateTotalNet,
  calculateWeightedScore,
  getSubjectLabel,
} from "@/lib/score-calculator";
import { formatScore, SCHOOL_TYPE_LABELS } from "@/lib/utils";
import { createClient } from "@/lib/supabase";
import type { SchoolWithScore } from "@/types/database";

interface SchoolWithYearlyScores extends SchoolWithScore {
  yearlyScores: Record<number, number | null>;
}

const subjectKeys: (keyof LGSInput)[] = [
  "turkce",
  "matematik",
  "fen",
  "inkilap",
  "din",
  "yabanciDil",
];

const subjectColors: Record<keyof LGSInput, string> = {
  turkce: "bg-blue-500",
  matematik: "bg-indigo-500",
  fen: "bg-emerald-500",
  inkilap: "bg-amber-500",
  din: "bg-rose-500",
  yabanciDil: "bg-purple-500",
};

const TYPE_STYLES: Record<string, string> = {
  fen: "bg-purple-100 text-purple-700",
  anadolu: "bg-blue-100 text-blue-700",
  sosyal: "bg-amber-100 text-amber-700",
  imam_hatip: "bg-teal-100 text-teal-700",
  meslek: "bg-gray-100 text-gray-700",
};

function getDifficultyBadge(userScore: number, schoolScore: number) {
  const diff = userScore - schoolScore;
  if (diff >= 10) return { label: "Rahat gelir", cls: "bg-emerald-100 text-emerald-700" };
  if (diff >= 3) return { label: "Gelir", cls: "bg-green-100 text-green-700" };
  if (diff >= -3) return { label: "Sınırda", cls: "bg-amber-100 text-amber-700" };
  if (diff >= -15) return { label: "Zor", cls: "bg-orange-100 text-orange-700" };
  return { label: "Çok Zor", cls: "bg-red-100 text-red-700" };
}

const emptyInput: LGSInput = {
  turkce: 15,
  matematik: 17,
  fen: 17,
  inkilap: 8,
  din: 8,
  yabanciDil: 9,
};

export default function ScoreCalculator() {
  const [nets, setNets] = useState<LGSInput>({ ...emptyInput });
  const [calculated, setCalculated] = useState(false);
  const [formOpen, setFormOpen] = useState(true);
  const [matchingSchools, setMatchingSchools] = useState<SchoolWithYearlyScores[]>([]);
  const [loadingSchools, setLoadingSchools] = useState(false);
  const [page, setPage] = useState(1);
  const perPage = 10;

  const totalNet = calculateTotalNet(nets);
  const weightedScore = calculateWeightedScore(nets);
  const maxNet = 90;
  const percentage = (totalNet / maxNet) * 100;

  function handleChange(key: keyof LGSInput, value: string) {
    const num = value === "" ? 0 : Number(value);
    if (isNaN(num) || num < 0 || num > LGS_LIMITS[key]) return;
    setNets((prev) => ({ ...prev, [key]: num }));
    setCalculated(false);
  }

  async function handleCalculate() {
    setCalculated(true);
    setFormOpen(false);
    setLoadingSchools(true);
    setPage(1);

    const score = calculateWeightedScore(nets);

    try {
      const supabaseQ = createClient();

      const { data: scores2026 } = await supabaseQ
        .from("placement_scores")
        .select("*")
        .eq("year", 2026)
        .gte("min_score", score - 50)
        .lte("min_score", score + 30)
        .order("min_score", { ascending: false })
        .limit(500);

      if (scores2026 && scores2026.length > 0) {
        const schoolIds = [...new Set(scores2026.map((s: any) => s.school_id))];

        const [{ data: schools }, { data: allScores }] = await Promise.all([
          supabaseQ.from("schools").select("*").in("id", schoolIds),
          supabaseQ.from("placement_scores").select("*").in("school_id", schoolIds).order("year", { ascending: true }).limit(5000),
        ]);

        const merged: SchoolWithYearlyScores[] = (schools ?? []).map((school: any) => {
          const schoolScores = (allScores ?? []).filter((s: any) => s.school_id === school.id);
          const yearlyScores: Record<number, number | null> = {};
          for (const s of schoolScores) yearlyScores[s.year] = s.min_score;
          return {
            ...school,
            placement: scores2026.find((s: any) => s.school_id === school.id) ?? null,
            yearlyScores,
          };
        });

        const badgeOrder = ["Rahat gelir", "Gelir", "Sınırda", "Zor", "Çok Zor"];
        merged.sort((a, b) => {
          const ba = getDifficultyBadge(score, a.placement?.min_score ?? 0);
          const bb = getDifficultyBadge(score, b.placement?.min_score ?? 0);
          const diff = badgeOrder.indexOf(ba.label) - badgeOrder.indexOf(bb.label);
          if (diff !== 0) return diff;
          return (b.placement?.min_score ?? 0) - (a.placement?.min_score ?? 0);
        });

        setMatchingSchools(merged);
      } else {
        setMatchingSchools([]);
      }
    } catch {
      setMatchingSchools([]);
    }

    setLoadingSchools(false);

    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      supabase.from("score_history").insert({
        user_id: user.id,
        turkce: nets.turkce,
        matematik: nets.matematik,
        fen: nets.fen,
        inkilap: nets.inkilap,
        din: nets.din,
        yabanci_dil: nets.yabanciDil,
        total_net: calculateTotalNet(nets),
        estimated_score: score,
        source: "manual",
      }).then(() => {});
    });
  }

  function handleReset() {
    setNets({ turkce: 0, matematik: 0, fen: 0, inkilap: 0, din: 0, yabanciDil: 0 });
    setCalculated(false);
    setFormOpen(true);
    setMatchingSchools([]);
    setPage(1);
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-border bg-card">
        <button
          onClick={() => setFormOpen((o) => !o)}
          className="flex w-full items-center justify-between p-6 text-left"
        >
          <div>
            <h2 className="text-lg font-semibold text-foreground">
              Ders Netleri
            </h2>
            {!formOpen && calculated && (
              <p className="mt-1 text-sm text-muted">
                Toplam {totalNet} net · Tahmini {formatScore(weightedScore)} puan
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            {!formOpen && calculated && (
              <span className="flex items-center gap-1 rounded-lg bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary">
                <Pencil className="h-3 w-3" />
                Düzenle
              </span>
            )}
            {formOpen ? (
              <ChevronUp className="h-5 w-5 text-muted" />
            ) : (
              <ChevronDown className="h-5 w-5 text-muted" />
            )}
          </div>
        </button>

        {formOpen && (
          <div className="px-6 pb-6">
            <div className="mb-4 flex justify-end">
              <button
                onClick={(e) => { e.stopPropagation(); handleReset(); }}
                className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-muted transition-colors hover:bg-primary/5 hover:text-foreground"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Sıfırla
              </button>
            </div>

            <div className="space-y-4">
              {subjectKeys.map((key) => {
                const limit = LGS_LIMITS[key];
                const value = nets[key];
                const pct = (value / limit) * 100;

                return (
                  <div key={key} className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label
                        htmlFor={key}
                        className="text-sm font-medium text-foreground"
                      >
                        {getSubjectLabel(key)}
                      </label>
                      <span className="text-xs text-muted">
                        {value} / {limit}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="relative h-2 flex-1 overflow-hidden rounded-full bg-border">
                        <div
                          className={`absolute inset-y-0 left-0 rounded-full transition-all ${subjectColors[key]}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <input
                        id={key}
                        type="number"
                        inputMode="numeric"
                        min={0}
                        max={limit}
                        value={value || ""}
                        onChange={(e) => handleChange(key, e.target.value)}
                        onFocus={(e) => e.target.select()}
                        placeholder="0"
                        className="w-16 rounded-lg border border-border bg-background px-3 py-2 text-center text-sm font-medium text-foreground outline-none transition-colors focus:border-primary"
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            <button
              onClick={handleCalculate}
              className="mt-6 w-full rounded-xl bg-primary py-3 text-sm font-semibold text-white shadow-lg shadow-primary/25 transition-all hover:bg-primary-dark hover:shadow-xl"
            >
              Hesapla
            </button>
          </div>
        )}
      </div>

      {calculated && (
        <div className="rounded-2xl border border-border bg-card p-6">
          <h2 className="mb-4 text-lg font-semibold text-foreground">
            Sonuç
          </h2>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl bg-indigo-50 p-4">
              <p className="text-sm text-indigo-600">Toplam Net</p>
              <p className="mt-1 text-2xl font-bold text-indigo-700">
                {totalNet}
                <span className="text-sm font-normal text-indigo-500">
                  {" "}
                  / {maxNet}
                </span>
              </p>
            </div>
            <div className="rounded-xl bg-emerald-50 p-4">
              <p className="text-sm text-emerald-600">Tahmini Puan</p>
              <p className="mt-1 text-2xl font-bold text-emerald-700">
                {formatScore(weightedScore)}
                <span className="text-sm font-normal text-emerald-500">
                  {" "}
                  / 500
                </span>
              </p>
            </div>
          </div>

          <div className="mt-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted">Doluluk Oranı</span>
              <span className="font-medium text-foreground">
                %{percentage.toFixed(1)}
              </span>
            </div>
            <div className="mt-1.5 h-3 overflow-hidden rounded-full bg-border">
              <div
                className="h-full rounded-full bg-gradient-to-r from-primary to-indigo-400 transition-all"
                style={{ width: `${percentage}%` }}
              />
            </div>
          </div>

          <div className="mt-4 space-y-2">
            {subjectKeys.map((key) => {
              const limit = LGS_LIMITS[key];
              const value = nets[key];
              const pct = (value / limit) * 100;

              return (
                <div key={key} className="flex items-center gap-3 text-sm">
                  <span className="w-28 text-muted">
                    {getSubjectLabel(key)}
                  </span>
                  <div className="relative h-2 flex-1 overflow-hidden rounded-full bg-border">
                    <div
                      className={`absolute inset-y-0 left-0 rounded-full ${subjectColors[key]}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="w-12 text-right font-medium text-foreground">
                    {value}/{limit}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {calculated && loadingSchools && (
        <div className="rounded-2xl border border-border bg-card p-6">
          <div className="flex items-center gap-3">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            <span className="text-sm text-muted">Uygun okullar aranıyor...</span>
          </div>
        </div>
      )}

      {calculated && !loadingSchools && matchingSchools.length > 0 && (
        <div className="rounded-2xl border border-border bg-card p-6">
          <div className="mb-4 flex items-center gap-2">
            <School className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold text-foreground">
              Uygun Okullar
            </h2>
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
              {matchingSchools.length}
            </span>
          </div>

          <div className="space-y-3">
            {matchingSchools.slice((page - 1) * perPage, page * perPage).map(
              (school) => {
                const badge = getDifficultyBadge(
                  weightedScore,
                  school.placement?.min_score ?? 0
                );
                return (
                  <Link
                    key={school.id}
                    href={`/schools/${school.id}`}
                    className="block rounded-xl border border-border p-4 transition-all hover:border-primary/30 hover:shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${TYPE_STYLES[school.type] ?? TYPE_STYLES.meslek}`}
                          >
                            {SCHOOL_TYPE_LABELS[school.type] ?? school.type}
                          </span>
                          <span
                            className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${badge.cls}`}
                          >
                            {badge.label}
                          </span>
                        </div>
                        <p className="mt-1 text-sm font-semibold text-foreground">
                          {school.name}
                        </p>
                        <div className="mt-0.5 flex items-center gap-1 text-xs text-muted">
                          <MapPin className="h-3 w-3" />
                          {school.district}, {school.city}
                        </div>
                      </div>
                    </div>
                    <div className="mt-3 flex gap-2 overflow-x-auto">
                      {Object.keys(school.yearlyScores).map(Number).sort((a, b) => b - a).map((year, _i, arr) => {
                        const val = school.yearlyScores[year];
                        const isLatest = year === arr[0];
                        return (
                          <div
                            key={year}
                            className={`flex-1 rounded-lg px-2 py-1.5 text-center ${
                              isLatest
                                ? "bg-primary/10"
                                : "bg-background"
                            }`}
                          >
                            <p className="text-[10px] text-muted">{year}</p>
                            <p
                              className={`text-xs font-bold ${
                                isLatest
                                  ? "text-primary"
                                  : "text-foreground"
                              }`}
                            >
                              {val != null ? val.toFixed(2) : "—"}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  </Link>
                );
              }
            )}
          </div>

          {matchingSchools.length > perPage && (() => {
            const totalPages = Math.ceil(matchingSchools.length / perPage);
            return (
              <div className="mt-4 flex items-center justify-between">
                <p className="text-xs text-muted">
                  {(page - 1) * perPage + 1}–{Math.min(page * perPage, matchingSchools.length)} / {matchingSchools.length} okul
                </p>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="rounded-lg p-2 text-muted transition-colors hover:bg-background hover:text-foreground disabled:opacity-30"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                    .reduce<(number | "...")[]>((acc, p, idx, arr) => {
                      if (idx > 0 && p - (arr[idx - 1] ?? 0) > 1) acc.push("...");
                      acc.push(p);
                      return acc;
                    }, [])
                    .map((p, i) =>
                      p === "..." ? (
                        <span key={`dot-${i}`} className="px-1 text-xs text-muted">...</span>
                      ) : (
                        <button
                          key={p}
                          onClick={() => setPage(p)}
                          className={`h-8 w-8 rounded-lg text-xs font-medium transition-colors ${
                            p === page
                              ? "bg-primary text-white"
                              : "text-muted hover:bg-background hover:text-foreground"
                          }`}
                        >
                          {p}
                        </button>
                      )
                    )}
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="rounded-lg p-2 text-muted transition-colors hover:bg-background hover:text-foreground disabled:opacity-30"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {calculated && !loadingSchools && matchingSchools.length === 0 && (
        <div className="rounded-2xl border border-border bg-card p-6 text-center">
          <p className="text-sm text-muted">
            Bu puan aralığında uygun okul bulunamadı.
          </p>
        </div>
      )}
    </div>
  );
}

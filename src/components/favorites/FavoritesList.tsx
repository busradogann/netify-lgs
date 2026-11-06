"use client";

import { useState, useMemo } from "react";
import {
  Heart,
  GitCompareArrows,
  X,
  Trash2,
  MapPin,
  TrendingUp,
  Award,
  Users,
} from "lucide-react";
import Link from "next/link";
import type { SchoolWithScore } from "@/types/database";
import { SCHOOL_TYPE_LABELS, formatRanking, formatScore } from "@/lib/utils";
import { TYPE_STYLES } from "@/lib/constants";
import { createClient } from "@/lib/supabase";

export default function FavoritesList({
  initialSchools,
}: {
  initialSchools: SchoolWithScore[];
}) {
  const [schools, setSchools] = useState(initialSchools);
  const [compareIds, setCompareIds] = useState<Set<string>>(new Set());
  const [showCompare, setShowCompare] = useState(false);

  const favorites = schools;

  const compareSchools = useMemo(
    () => schools.filter((s) => compareIds.has(s.id)),
    [schools, compareIds]
  );

  function toggleCompare(id: string) {
    setCompareIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else if (next.size < 4) {
        next.add(id);
      }
      return next;
    });
  }

  async function removeFavorite(id: string) {
    const supabase = createClient();
    await supabase.from("favorites").delete().eq("school_id", id);
    setSchools((prev) => prev.filter((s) => s.id !== id));
    setCompareIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }

  if (favorites.length === 0) {
    return (
      <div className="rounded-2xl border border-border bg-card p-8 text-center">
        <div className="mx-auto mb-4 inline-flex rounded-full bg-muted/10 p-4">
          <Heart className="h-8 w-8 text-muted" />
        </div>
        <h2 className="text-lg font-semibold text-foreground">
          Henüz favori okul yok
        </h2>
        <p className="mt-2 text-sm text-muted">
          Okullar sayfasından beğendiğin okulları favorilere ekle.
        </p>
        <Link
          href="/schools"
          className="mt-4 inline-block rounded-xl bg-primary px-6 py-2.5 text-sm font-semibold text-white transition-all hover:bg-primary-dark"
        >
          Okulları Keşfet
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted">{favorites.length} okul favorilerde</p>
        {compareIds.size >= 2 && (
          <button
            onClick={() => setShowCompare(true)}
            className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-primary-dark"
          >
            <GitCompareArrows className="h-4 w-4" />
            Karşılaştır ({compareIds.size})
          </button>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {favorites.map((school) => (
          <FavoriteCard
            key={school.id}
            school={school}
            isComparing={compareIds.has(school.id)}
            onToggleCompare={() => toggleCompare(school.id)}
            onRemove={() => removeFavorite(school.id)}
            compareFull={compareIds.size >= 4 && !compareIds.has(school.id)}
          />
        ))}
      </div>

      {compareIds.size > 0 && compareIds.size < 2 && (
        <p className="text-center text-sm text-muted">
          Karşılaştırmak için en az 2 okul seç (maks. 4)
        </p>
      )}

      {showCompare && compareSchools.length >= 2 && (
        <CompareModal
          schools={compareSchools}
          onClose={() => setShowCompare(false)}
        />
      )}
    </div>
  );
}

function FavoriteCard({
  school,
  isComparing,
  onToggleCompare,
  onRemove,
  compareFull,
}: {
  school: SchoolWithScore;
  isComparing: boolean;
  onToggleCompare: () => void;
  onRemove: () => void;
  compareFull: boolean;
}) {
  const p = school.placement;

  return (
    <div
      className={`relative rounded-2xl border bg-card p-5 transition-all ${
        isComparing ? "border-primary shadow-md" : "border-border"
      }`}
    >
      <div className="mb-3 flex items-center justify-between">
        <span
          className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${TYPE_STYLES[school.type] ?? TYPE_STYLES.meslek}`}
        >
          {SCHOOL_TYPE_LABELS[school.type] ?? school.type}
        </span>
        <div className="flex items-center gap-1">
          <button
            onClick={onToggleCompare}
            disabled={compareFull}
            title={isComparing ? "Karşılaştırmadan çıkar" : "Karşılaştır"}
            className={`rounded-lg p-1.5 transition-colors ${
              isComparing
                ? "bg-primary/10 text-primary"
                : "text-muted hover:bg-background hover:text-foreground disabled:opacity-30"
            }`}
          >
            <GitCompareArrows className="h-4 w-4" />
          </button>
          <button
            onClick={onRemove}
            title="Favorilerden çıkar"
            className="rounded-lg p-1.5 text-muted transition-colors hover:bg-red-50 hover:text-red-500"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      <Link href={`/schools/${school.id}`} className="group">
        <h3 className="font-semibold text-foreground group-hover:text-primary">
          {school.name}
        </h3>
        <div className="mt-1 flex items-center gap-1 text-xs text-muted">
          <MapPin className="h-3 w-3" />
          <span>
            {school.district}, {school.city}
          </span>
        </div>
      </Link>

      {p && (
        <div className="mt-3 grid grid-cols-3 gap-2">
          <div className="rounded-lg bg-background px-2 py-1.5 text-center">
            <p className="text-[10px] text-muted">Sıralama</p>
            <p className="text-sm font-bold text-foreground">
              {formatRanking(p.min_ranking!)}
            </p>
          </div>
          <div className="rounded-lg bg-background px-2 py-1.5 text-center">
            <p className="text-[10px] text-muted">Puan</p>
            <p className="text-sm font-bold text-foreground">
              {p.min_score?.toFixed(1)}
            </p>
          </div>
          <div className="rounded-lg bg-background px-2 py-1.5 text-center">
            <p className="text-[10px] text-muted">Kontenjan</p>
            <p className="text-sm font-bold text-foreground">{p.quota}</p>
          </div>
        </div>
      )}
    </div>
  );
}

function CompareModal({
  schools,
  onClose,
}: {
  schools: SchoolWithScore[];
  onClose: () => void;
}) {
  const fields: {
    label: string;
    icon: React.ReactNode;
    getValue: (s: SchoolWithScore) => string;
    getBest?: (vals: (number | null)[]) => number;
  }[] = [
    {
      label: "Tür",
      icon: null,
      getValue: (s) => SCHOOL_TYPE_LABELS[s.type] ?? s.type,
    },
    {
      label: "Şehir / İlçe",
      icon: <MapPin className="h-3.5 w-3.5" />,
      getValue: (s) => `${s.district}, ${s.city}`,
    },
    {
      label: "Taban Sıralama",
      icon: <TrendingUp className="h-3.5 w-3.5" />,
      getValue: (s) =>
        s.placement?.min_ranking
          ? formatRanking(s.placement.min_ranking)
          : "-",
      getBest: (vals) => {
        const filtered = vals.filter((v): v is number => v !== null);
        return vals.indexOf(Math.min(...filtered));
      },
    },
    {
      label: "Taban Puan",
      icon: <Award className="h-3.5 w-3.5" />,
      getValue: (s) =>
        s.placement?.min_score ? formatScore(s.placement.min_score) : "-",
      getBest: (vals) => {
        const filtered = vals.filter((v): v is number => v !== null);
        return vals.indexOf(Math.max(...filtered));
      },
    },
    {
      label: "Kontenjan",
      icon: <Users className="h-3.5 w-3.5" />,
      getValue: (s) =>
        s.placement?.quota ? String(s.placement.quota) : "-",
    },
    {
      label: "Yerleşen",
      icon: <Users className="h-3.5 w-3.5" />,
      getValue: (s) =>
        s.placement?.placed ? String(s.placement.placed) : "-",
    },
    {
      label: "Doluluk",
      icon: null,
      getValue: (s) =>
        s.placement?.quota && s.placement?.placed
          ? `%${Math.round((s.placement.placed / s.placement.quota) * 100)}`
          : "-",
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="max-h-[90vh] w-full max-w-4xl overflow-auto rounded-2xl border border-border bg-card p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-foreground">
            Okul Karşılaştırma
          </h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-muted transition-colors hover:bg-background hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full table-fixed text-sm">
            <colgroup>
              <col className="w-[120px]" />
              {schools.map((s) => (
                <col key={s.id} />
              ))}
            </colgroup>
            <thead>
              <tr className="border-b border-border">
                <th className="pb-3 pr-4 text-left text-xs font-medium text-muted" />
                {schools.map((s) => (
                  <th
                    key={s.id}
                    className="pb-3 pr-4 text-left text-xs font-semibold text-foreground"
                  >
                    <span
                      className={`mb-1 inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold ${TYPE_STYLES[s.type] ?? TYPE_STYLES.meslek}`}
                    >
                      {SCHOOL_TYPE_LABELS[s.type] ?? s.type}
                    </span>
                    <br />
                    <Link
                      href={`/schools/${s.id}`}
                      className="line-clamp-2 text-sm hover:text-primary"
                    >
                      {s.name}
                    </Link>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {fields.map((field) => {
                const values = schools.map((s) => field.getValue(s));
                const numValues = schools.map(
                  (s) =>
                    field.label === "Taban Sıralama"
                      ? s.placement?.min_ranking ?? null
                      : field.label === "Taban Puan"
                        ? s.placement?.min_score ?? null
                        : null
                );
                const bestIndex = field.getBest
                  ? field.getBest(numValues)
                  : -1;

                return (
                  <tr
                    key={field.label}
                    className="border-b border-border/50 last:border-0"
                  >
                    <td className="py-3 pr-4 text-xs font-medium text-muted">
                      <span className="flex items-center gap-1.5">
                        {field.icon}
                        {field.label}
                      </span>
                    </td>
                    {values.map((val, i) => (
                      <td
                        key={i}
                        className={`py-3 pr-4 font-medium ${
                          i === bestIndex
                            ? "text-primary"
                            : "text-foreground"
                        }`}
                      >
                        {val}
                        {i === bestIndex && (
                          <span className="ml-1.5 rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold text-primary">
                            En iyi
                          </span>
                        )}
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

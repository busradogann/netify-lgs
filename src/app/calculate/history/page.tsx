"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { History, TrendingUp, ArrowLeft, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase";
import type { ScoreHistory } from "@/types/database";

const subjectLabels: Record<string, string> = {
  turkce: "Türkçe",
  matematik: "Matematik",
  fen: "Fen",
  inkilap: "İnkılap",
  din: "Din",
  yabanci_dil: "Yabancı Dil",
};

const subjectColors: Record<string, string> = {
  turkce: "#3b82f6",
  matematik: "#6366f1",
  fen: "#10b981",
  inkilap: "#f59e0b",
  din: "#f43f5e",
  yabanci_dil: "#a855f7",
};

export default function ScoreHistoryPage() {
  const [history, setHistory] = useState<ScoreHistory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { setLoading(false); return; }
      supabase
        .from("score_history")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: true })
        .limit(100)
        .then(({ data }) => {
          if (data) setHistory(data as ScoreHistory[]);
          setLoading(false);
        });
    });
  }, []);

  async function handleDelete(id: string) {
    setHistory((h) => h.filter((x) => x.id !== id));
    const supabase = createClient();
    await supabase.from("score_history").delete().eq("id", id);
  }

  const latest = history[history.length - 1];
  const prev = history.length > 1 ? history[history.length - 2] : null;
  const scoreDiff =
    latest && prev && latest.estimated_score != null && prev.estimated_score != null
      ? latest.estimated_score - prev.estimated_score
      : null;

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="mb-6 flex items-center gap-3">
        <Link
          href="/calculate"
          className="rounded-lg p-2 text-muted hover:bg-primary/10 hover:text-foreground"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="flex items-center gap-2">
          <History className="h-5 w-5 text-primary" />
          <h1 className="text-xl font-bold text-foreground">Puan Geçmişi</h1>
        </div>
      </div>

      {loading && (
        <div className="flex items-center gap-3 rounded-2xl border border-border bg-card p-6">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <span className="text-sm text-muted">Yükleniyor...</span>
        </div>
      )}

      {!loading && history.length === 0 && (
        <div className="rounded-2xl border border-border bg-card p-8 text-center">
          <History className="mx-auto mb-3 h-10 w-10 text-muted/40" />
          <p className="text-sm font-medium text-foreground">Henüz kayıt yok</p>
          <p className="mt-1 text-xs text-muted">
            Puan hesapladığında buraya otomatik kaydedilecek.
          </p>
          <Link
            href="/calculate"
            className="mt-4 inline-block rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white"
          >
            Hesapla
          </Link>
        </div>
      )}

      {!loading && history.length > 0 && (
        <>
          {/* Summary cards */}
          <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
            <div className="rounded-xl bg-indigo-50 p-4">
              <p className="text-xs font-medium text-indigo-600/70">Son Puan</p>
              <p className="text-2xl font-bold text-indigo-700">
                {latest.estimated_score?.toFixed(2) ?? "—"}
              </p>
            </div>
            <div className="rounded-xl bg-emerald-50 p-4">
              <p className="text-xs font-medium text-emerald-600/70">Son Net</p>
              <p className="text-2xl font-bold text-emerald-700">
                {latest.total_net}
              </p>
            </div>
            {scoreDiff !== null && (
              <div
                className={`rounded-xl p-4 ${
                  scoreDiff >= 0 ? "bg-green-50" : "bg-red-50"
                }`}
              >
                <p
                  className={`text-xs font-medium ${
                    scoreDiff >= 0
                      ? "text-green-600/70"
                      : "text-red-600/70"
                  }`}
                >
                  Değişim
                </p>
                <p
                  className={`flex items-center gap-1 text-2xl font-bold ${
                    scoreDiff >= 0 ? "text-green-700" : "text-red-700"
                  }`}
                >
                  <TrendingUp
                    className={`h-5 w-5 ${scoreDiff < 0 ? "rotate-180" : ""}`}
                  />
                  {scoreDiff > 0 ? "+" : ""}
                  {scoreDiff.toFixed(2)}
                </p>
              </div>
            )}
          </div>

          {/* Chart */}
          {history.length >= 2 && <ScoreChart history={history} />}

          {/* Subject breakdown chart */}
          {history.length >= 2 && <SubjectChart history={history} />}

          {/* History list */}
          <div className="mt-6 rounded-2xl border border-border bg-card p-4">
            <h2 className="mb-3 text-sm font-semibold text-foreground">
              Tüm Kayıtlar ({history.length})
            </h2>
            <div className="space-y-2">
              {[...history].reverse().map((h) => (
                <div
                  key={h.id}
                  className="flex items-center justify-between rounded-xl border border-border p-3"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-3">
                      <span className="text-lg font-bold text-primary">
                        {h.estimated_score?.toFixed(2) ?? "—"}
                      </span>
                      <span className="text-xs text-muted">
                        {h.total_net} net
                      </span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                          (h as any).source === "deneme"
                            ? "bg-purple-100 text-purple-700"
                            : "bg-blue-100 text-blue-700"
                        }`}
                      >
                        {(h as any).source === "deneme" ? "Deneme" : "Manuel"}
                      </span>
                    </div>
                    <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-[10px] text-muted">
                      <span>Tür: {h.turkce}</span>
                      <span>Mat: {h.matematik}</span>
                      <span>Fen: {h.fen}</span>
                      <span>İnk: {h.inkilap}</span>
                      <span>Din: {h.din}</span>
                      <span>Yab: {h.yabanci_dil}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] text-muted">
                      {new Date(h.created_at).toLocaleDateString("tr-TR", {
                        day: "numeric",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                    <button
                      onClick={() => handleDelete(h.id)}
                      className="rounded-lg p-1.5 text-muted hover:bg-red-50 hover:text-red-500"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function getMotivation(current: number, prev: number | null): string | null {
  if (prev === null) return null;
  if (current > prev) return "İyisin he 💪";
  if (current === prev) return "Ha gayret 🔥";
  return "Toparlan 📚";
}

function ScoreChart({ history }: { history: ScoreHistory[] }) {
  const scores = history
    .map((h) => h.estimated_score)
    .filter((s): s is number => s != null);
  if (scores.length < 2) return null;

  const min = Math.min(...scores);
  const max = Math.max(...scores);
  const range = max - min || 1;
  const padding = range * 0.15;
  const chartMin = min - padding;
  const chartMax = max + padding;
  const chartRange = chartMax - chartMin;

  const w = 600;
  const h = 200;
  const px = 40;
  const py = 20;

  const points = scores.map((s, i) => ({
    x: px + ((w - 2 * px) / (scores.length - 1)) * i,
    y: py + (1 - (s - chartMin) / chartRange) * (h - 2 * py),
    val: s,
    motivation: getMotivation(s, i > 0 ? scores[i - 1] : null),
  }));

  const line = points.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ");
  const area = `${line} L${points[points.length - 1].x},${h - py} L${points[0].x},${h - py} Z`;

  const gridLines = 4;
  const gridValues = Array.from({ length: gridLines + 1 }, (_, i) =>
    chartMin + (chartRange / gridLines) * i
  );

  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
        <TrendingUp className="h-4 w-4 text-primary" />
        Puan Gelişimi
      </h2>
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full" style={{ maxHeight: 220 }}>
        {gridValues.map((val) => {
          const y = py + (1 - (val - chartMin) / chartRange) * (h - 2 * py);
          return (
            <g key={val}>
              <line
                x1={px}
                y1={y}
                x2={w - px}
                y2={y}
                stroke="var(--color-border)"
                strokeDasharray="4"
                strokeWidth={0.5}
              />
              <text
                x={px - 6}
                y={y + 3}
                textAnchor="end"
                fill="var(--color-muted)"
                fontSize={9}
              >
                {val.toFixed(0)}
              </text>
            </g>
          );
        })}
        <path d={area} fill="url(#scoreGrad)" opacity={0.15} />
        <path d={line} fill="none" stroke="#6366f1" strokeWidth={2.5} strokeLinejoin="round" />
        {points.map((p, i) => (
          <g key={i} className="group/dot">
            <circle cx={p.x} cy={p.y} r={12} fill="transparent" className="cursor-pointer" />
            <circle cx={p.x} cy={p.y} r={4} fill="white" stroke="#6366f1" strokeWidth={2} className="pointer-events-none" />
            <text
              x={p.x}
              y={p.y - 10}
              textAnchor="middle"
              fill="var(--color-foreground)"
              fontSize={9}
              fontWeight={600}
              className="pointer-events-none"
            >
              {p.val.toFixed(1)}
            </text>
            {p.motivation && (
              <g className="opacity-0 transition-opacity group-hover/dot:opacity-100">
                <rect
                  x={p.x - 50}
                  y={p.y + 10}
                  width={100}
                  height={22}
                  rx={6}
                  fill="var(--color-foreground)"
                  opacity={0.9}
                />
                <text
                  x={p.x}
                  y={p.y + 25}
                  textAnchor="middle"
                  fill="var(--color-background)"
                  fontSize={10}
                  fontWeight={600}
                >
                  {p.motivation}
                </text>
              </g>
            )}
          </g>
        ))}
        <defs>
          <linearGradient id="scoreGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#6366f1" />
            <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}

function SubjectChart({ history }: { history: ScoreHistory[] }) {
  const subjectKeys = ["turkce", "matematik", "fen", "inkilap", "din", "yabanci_dil"] as const;
  const limits: Record<string, number> = {
    turkce: 20,
    matematik: 20,
    fen: 20,
    inkilap: 10,
    din: 10,
    yabanci_dil: 10,
  };

  const latest = history[history.length - 1];
  const prev = history.length > 1 ? history[history.length - 2] : null;

  return (
    <div className="mt-4 rounded-2xl border border-border bg-card p-4">
      <h2 className="mb-3 text-sm font-semibold text-foreground">
        Ders Bazlı Son Durum
      </h2>
      <div className="space-y-3">
        {subjectKeys.map((key) => {
          const val = latest[key] as number;
          const limit = limits[key];
          const pct = (val / limit) * 100;
          const prevVal = prev ? (prev[key] as number) : null;
          const diff = prevVal !== null ? val - prevVal : null;

          return (
            <div key={key} className="flex items-center gap-3">
              <span className="w-20 text-xs text-muted">
                {subjectLabels[key]}
              </span>
              <div className="relative h-3 flex-1 overflow-hidden rounded-full bg-border">
                <div
                  className="absolute inset-y-0 left-0 rounded-full transition-all"
                  style={{
                    width: `${pct}%`,
                    backgroundColor: subjectColors[key],
                  }}
                />
              </div>
              <span className="w-10 text-right text-xs font-semibold text-foreground">
                {val}/{limit}
              </span>
              {diff !== null && diff !== 0 && (
                <span
                  className={`w-8 text-right text-[10px] font-bold ${
                    diff > 0 ? "text-green-600" : "text-red-500"
                  }`}
                >
                  {diff > 0 ? "+" : ""}
                  {diff}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

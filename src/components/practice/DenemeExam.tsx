"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  Clock,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  XCircle,
  Trophy,
  AlertTriangle,
  BookOpen,
  MapPin,
  School,
} from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase";
import { SCHOOL_TYPE_LABELS } from "@/lib/utils";
import type { Question, Subject, SchoolWithScore } from "@/types/database";

const EXAM_DURATION = 155 * 60;

const SUBJECT_DISTRIBUTION: { subject: Subject; count: number }[] = [
  { subject: "turkce", count: 20 },
  { subject: "matematik", count: 20 },
  { subject: "fen", count: 20 },
  { subject: "inkilap", count: 10 },
  { subject: "din", count: 10 },
  { subject: "yabanciDil", count: 10 },
];

const SUBJECT_LABELS: Record<Subject, string> = {
  turkce: "Türkçe",
  matematik: "Matematik",
  fen: "Fen Bilimleri",
  inkilap: "İnkılap Tarihi",
  din: "Din Kültürü",
  yabanciDil: "Yabancı Dil",
};

const SUBJECT_COLORS: Record<Subject, string> = {
  turkce: "bg-blue-500",
  matematik: "bg-indigo-500",
  fen: "bg-emerald-500",
  inkilap: "bg-amber-500",
  din: "bg-rose-500",
  yabanciDil: "bg-purple-500",
};

const NET_COEFFICIENTS: Record<Subject, number> = {
  turkce: 4,
  matematik: 4,
  fen: 4,
  inkilap: 2,
  din: 2,
  yabanciDil: 2,
};

const TYPE_STYLES: Record<string, string> = {
  fen: "bg-purple-100 text-purple-700",
  anadolu: "bg-blue-100 text-blue-700",
  sosyal: "bg-amber-100 text-amber-700",
  imam_hatip: "bg-teal-100 text-teal-700",
  meslek: "bg-gray-100 text-gray-700",
};

interface SchoolWithYearlyScores extends SchoolWithScore {
  yearlyScores: Record<number, number | null>;
}

function getDifficultyBadge(userScore: number, schoolScore: number) {
  const diff = userScore - schoolScore;
  if (diff >= 10) return { label: "Rahat gelir", cls: "bg-emerald-100 text-emerald-700" };
  if (diff >= 3) return { label: "Gelir", cls: "bg-green-100 text-green-700" };
  if (diff >= -3) return { label: "Sınırda", cls: "bg-amber-100 text-amber-700" };
  if (diff >= -15) return { label: "Zor", cls: "bg-orange-100 text-orange-700" };
  return { label: "Çok Zor", cls: "bg-red-100 text-red-700" };
}

type ExamPhase = "intro" | "exam" | "review" | "results";

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function DenemeExam() {
  const [phase, setPhase] = useState<ExamPhase>("intro");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<(number | null)[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(EXAM_DURATION);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [matchingSchools, setMatchingSchools] = useState<SchoolWithYearlyScores[]>([]);
  const [loadingSchools, setLoadingSchools] = useState(false);
  const [schoolPage, setSchoolPage] = useState(1);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const finishExam = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    setPhase("review");
  }, []);

  useEffect(() => {
    if (phase !== "exam") return;
    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          finishExam();
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [phase, finishExam]);

  async function startExam() {
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const allQuestions: Question[] = [];

    for (const { subject, count } of SUBJECT_DISTRIBUTION) {
      const { data, error: fetchError } = await supabase
        .from("questions")
        .select("*")
        .eq("subject", subject);

      if (fetchError || !data) {
        setError(`Sorular yüklenemedi: ${fetchError?.message}`);
        setLoading(false);
        return;
      }

      const shuffled = shuffleArray(data);
      allQuestions.push(...shuffled.slice(0, count));
    }

    setQuestions(allQuestions);
    setAnswers(new Array(allQuestions.length).fill(null));
    setCurrentIndex(0);
    setTimeLeft(EXAM_DURATION);
    setPhase("exam");
    setLoading(false);
  }

  function selectAnswer(index: number) {
    setAnswers((prev) => {
      const next = [...prev];
      next[currentIndex] = next[currentIndex] === index ? null : index;
      return next;
    });
  }

  function formatTime(seconds: number) {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
    return `${m}:${String(s).padStart(2, "0")}`;
  }

  async function fetchMatchingSchools() {
    setLoadingSchools(true);
    setSchoolPage(1);
    const { subjectResults: sr, estimatedScore: score } = calculateResults();

    // Save to score history
    const totalNet = Object.values(sr).reduce((s, r) => s + r.net, 0);
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      supabase.from("score_history").insert({
        user_id: user.id,
        turkce: Math.round(sr.turkce.net),
        matematik: Math.round(sr.matematik.net),
        fen: Math.round(sr.fen.net),
        inkilap: Math.round(sr.inkilap.net),
        din: Math.round(sr.din.net),
        yabanci_dil: Math.round(sr.yabanciDil.net),
        total_net: Math.round(totalNet),
        estimated_score: score,
        source: "deneme",
      }).then(() => {});
    });

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
  }

  function getSubjectRange(subject: Subject): [number, number] {
    let start = 0;
    for (const d of SUBJECT_DISTRIBUTION) {
      if (d.subject === subject) return [start, start + d.count];
      start += d.count;
    }
    return [0, 0];
  }

  function calculateResults() {
    const subjectResults: Record<Subject, { correct: number; wrong: number; empty: number; net: number }> = {} as any;
    let idx = 0;

    for (const { subject, count } of SUBJECT_DISTRIBUTION) {
      let correct = 0, wrong = 0, empty = 0;
      for (let i = idx; i < idx + count; i++) {
        if (answers[i] === null) {
          empty++;
        } else if (answers[i] === questions[i].correct_index) {
          correct++;
        } else {
          wrong++;
        }
      }
      const net = correct - wrong / 3;
      subjectResults[subject] = { correct, wrong, empty, net };
      idx += count;
    }

    let totalWeightedNet = 0;
    for (const { subject } of SUBJECT_DISTRIBUTION) {
      totalWeightedNet += subjectResults[subject].net * NET_COEFFICIENTS[subject];
    }

    const estimatedScore = 200 + (totalWeightedNet / 18) * 300;
    const clampedScore = Math.max(200, Math.min(500, estimatedScore));

    return { subjectResults, estimatedScore: clampedScore };
  }

  // --- INTRO ---
  if (phase === "intro") {
    return (
      <div className="space-y-6">
        <div className="rounded-2xl border border-border bg-card p-6">
          <h2 className="mb-4 text-lg font-semibold text-foreground">Sınav Bilgileri</h2>
          <div className="space-y-3 text-sm text-muted">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary" />
              <span>Süre: <span className="font-medium text-foreground">155 dakika</span></span>
            </div>
            <div className="flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-primary" />
              <span>Toplam: <span className="font-medium text-foreground">90 soru</span></span>
            </div>
          </div>

          <div className="mt-4 space-y-2">
            {SUBJECT_DISTRIBUTION.map(({ subject, count }) => (
              <div key={subject} className="flex items-center justify-between rounded-lg bg-background px-3 py-2">
                <div className="flex items-center gap-2">
                  <span className={`h-2 w-2 rounded-full ${SUBJECT_COLORS[subject]}`} />
                  <span className="text-sm text-foreground">{SUBJECT_LABELS[subject]}</span>
                </div>
                <span className="text-sm font-medium text-muted">{count} soru</span>
              </div>
            ))}
          </div>

          <div className="mt-4 rounded-lg bg-amber-50 p-3">
            <div className="flex gap-2 text-sm text-amber-700">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <div>
                <p className="font-medium">Önemli:</p>
                <p>Sınav başladıktan sonra geri sayım başlar. Her 3 yanlış 1 doğruyu götürür. Boş bırakılan sorular puanı etkilemez.</p>
              </div>
            </div>
          </div>
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}

        <button
          onClick={startExam}
          disabled={loading}
          className="w-full rounded-xl bg-primary py-3.5 text-sm font-semibold text-white shadow-lg shadow-primary/25 transition-all hover:bg-primary-dark disabled:opacity-50"
        >
          {loading ? "Sorular yükleniyor..." : "Sınava Başla"}
        </button>

        <Link
          href="/practice"
          className="block text-center text-sm text-muted transition-colors hover:text-foreground"
        >
          ← Alıştırma moduna dön
        </Link>
      </div>
    );
  }

  // --- EXAM ---
  if (phase === "exam") {
    const q = questions[currentIndex];
    const currentSubjectIdx = SUBJECT_DISTRIBUTION.findIndex((_, si) => {
      const [s, e] = getSubjectRange(SUBJECT_DISTRIBUTION[si].subject);
      return currentIndex >= s && currentIndex < e;
    });
    const currentSubject = SUBJECT_DISTRIBUTION[currentSubjectIdx];
    const [rangeStart] = getSubjectRange(currentSubject.subject);
    const questionInSubject = currentIndex - rangeStart + 1;

    const answeredCount = answers.filter((a) => a !== null).length;
    const isLowTime = timeLeft < 600;

    return (
      <div className="space-y-4">
        {/* Timer + Progress */}
        <div className="sticky top-0 z-10 rounded-2xl border border-border bg-card p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className={`h-4 w-4 ${isLowTime ? "text-red-500" : "text-primary"}`} />
              <span className={`text-lg font-bold tabular-nums ${isLowTime ? "text-red-500" : "text-foreground"}`}>
                {formatTime(timeLeft)}
              </span>
            </div>
            <div className="text-right text-sm text-muted">
              {answeredCount}/90 cevaplandı
            </div>
          </div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-border">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${(answeredCount / 90) * 100}%` }}
            />
          </div>
        </div>

        {/* Subject + Question number */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold text-white ${SUBJECT_COLORS[currentSubject.subject]}`}>
              {SUBJECT_LABELS[currentSubject.subject]}
            </span>
            <span className="text-sm text-muted">
              Soru {questionInSubject}/{currentSubject.count}
            </span>
          </div>
          <span className="text-xs text-muted">
            {currentIndex + 1}/90
          </span>
        </div>

        {/* Question */}
        <div className="rounded-2xl border border-border bg-card p-6">
          <p className="text-base font-medium text-foreground">{q.text}</p>
          <div className="mt-4 space-y-2">
            {(q.options as string[]).map((option, i) => (
              <button
                key={i}
                onClick={() => selectAnswer(i)}
                className={`flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left text-sm transition-all ${
                  answers[currentIndex] === i
                    ? "border-primary bg-primary/5 text-foreground"
                    : "border-border bg-background text-foreground hover:border-primary/30"
                }`}
              >
                <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs font-semibold ${
                  answers[currentIndex] === i ? "border-primary bg-primary text-white" : "border-current"
                }`}>
                  {String.fromCharCode(65 + i)}
                </span>
                <span>{option}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between gap-3">
          <button
            onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
            disabled={currentIndex === 0}
            className="flex items-center gap-1 rounded-xl border border-border px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-background disabled:opacity-30"
          >
            <ChevronLeft className="h-4 w-4" />
            Önceki
          </button>

          <button
            onClick={finishExam}
            className="rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-medium text-red-600 transition-colors hover:bg-red-100"
          >
            Sınavı Bitir
          </button>

          <button
            onClick={() => setCurrentIndex((i) => Math.min(questions.length - 1, i + 1))}
            disabled={currentIndex === questions.length - 1}
            className="flex items-center gap-1 rounded-xl border border-border px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-background disabled:opacity-30"
          >
            Sonraki
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        {/* Question map */}
        <div className="rounded-2xl border border-border bg-card p-4">
          <p className="mb-3 text-xs font-medium text-muted">Soru Haritası</p>
          <div className="flex flex-wrap gap-1.5">
            {questions.map((_, i) => {
              const isCurrent = i === currentIndex;
              const isAnswered = answers[i] !== null;

              let subjectForI: Subject = "turkce";
              let cumulative = 0;
              for (const d of SUBJECT_DISTRIBUTION) {
                if (i < cumulative + d.count) { subjectForI = d.subject; break; }
                cumulative += d.count;
              }

              const isNewSection = i === 0 || (() => {
                let prev: Subject = "turkce";
                let c = 0;
                for (const d of SUBJECT_DISTRIBUTION) {
                  if (i - 1 < c + d.count) { prev = d.subject; break; }
                  c += d.count;
                }
                return prev !== subjectForI;
              })();

              return (
                <span key={i} className={isNewSection && i > 0 ? "ml-1" : ""}>
                  <button
                    onClick={() => setCurrentIndex(i)}
                    className={`h-7 w-7 rounded text-[10px] font-semibold transition-all ${
                      isCurrent
                        ? "bg-primary text-white ring-2 ring-primary/30"
                        : isAnswered
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-background text-muted hover:bg-border"
                    }`}
                  >
                    {i + 1}
                  </button>
                </span>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // --- REVIEW (confirmation before results) ---
  if (phase === "review") {
    const unanswered = answers.filter((a) => a === null).length;
    return (
      <div className="space-y-6">
        <div className="rounded-2xl border border-border bg-card p-6 text-center">
          <AlertTriangle className="mx-auto mb-3 h-10 w-10 text-amber-500" />
          <h2 className="text-xl font-bold text-foreground">Sınavı Bitir</h2>
          <p className="mt-2 text-sm text-muted">
            {unanswered > 0
              ? `${unanswered} soru boş bırakıldı.`
              : "Tüm sorular cevaplandı."}
          </p>
          <p className="mt-1 text-sm text-muted">
            Sonuçları görmek istiyor musun?
          </p>
          <div className="mt-6 flex items-center justify-center gap-3">
            <button
              onClick={() => setPhase("exam")}
              className="rounded-xl border border-border px-6 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-background"
            >
              Geri Dön
            </button>
            <button
              onClick={async () => {
                setPhase("results");
                await fetchMatchingSchools();
              }}
              className="rounded-xl bg-primary px-6 py-2.5 text-sm font-semibold text-white transition-all hover:bg-primary-dark"
            >
              Sonuçları Gör
            </button>
          </div>
        </div>
      </div>
    );
  }

  // --- RESULTS ---
  const { subjectResults, estimatedScore } = calculateResults();
  const totalCorrect = Object.values(subjectResults).reduce((s, r) => s + r.correct, 0);
  const totalWrong = Object.values(subjectResults).reduce((s, r) => s + r.wrong, 0);
  const totalEmpty = Object.values(subjectResults).reduce((s, r) => s + r.empty, 0);
  const totalNet = Object.values(subjectResults).reduce((s, r) => s + r.net, 0);
  const percentage = Math.round((totalCorrect / 90) * 100);

  return (
    <div className="space-y-6">
      {/* Score card */}
      <div className="rounded-2xl border border-border bg-card p-6 text-center">
        <div className="mx-auto mb-4 inline-flex rounded-full bg-primary/10 p-4">
          <Trophy className="h-8 w-8 text-primary" />
        </div>
        <h2 className="text-xl font-bold text-foreground">Sınav Sonucu</h2>
        <div className="mt-4 text-4xl font-black text-primary">
          {estimatedScore.toFixed(2)}
        </div>
        <p className="mt-1 text-sm text-muted">Tahmini LGS Puanı</p>

        <div className="mx-auto mt-4 max-w-xs">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted">Başarı</span>
            <span className="font-semibold text-foreground">%{percentage}</span>
          </div>
          <div className="mt-1.5 h-3 overflow-hidden rounded-full bg-border">
            <div
              className={`h-full rounded-full transition-all ${
                percentage >= 70 ? "bg-emerald-500" : percentage >= 40 ? "bg-amber-500" : "bg-red-500"
              }`}
              style={{ width: `${percentage}%` }}
            />
          </div>
        </div>

        <div className="mt-6 grid grid-cols-4 gap-3">
          <ResultStat label="Doğru" value={totalCorrect} color="text-emerald-600" bg="bg-emerald-50" />
          <ResultStat label="Yanlış" value={totalWrong} color="text-red-600" bg="bg-red-50" />
          <ResultStat label="Boş" value={totalEmpty} color="text-gray-600" bg="bg-gray-50" />
          <ResultStat label="Net" value={Number(totalNet.toFixed(2))} color="text-primary" bg="bg-indigo-50" />
        </div>
      </div>

      {/* Per-subject breakdown */}
      <div className="rounded-2xl border border-border bg-card p-6">
        <h3 className="mb-4 text-lg font-semibold text-foreground">Ders Bazlı Sonuçlar</h3>
        <div className="space-y-3">
          {SUBJECT_DISTRIBUTION.map(({ subject, count }) => {
            const r = subjectResults[subject];
            return (
              <div key={subject} className="rounded-xl bg-background p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`h-2.5 w-2.5 rounded-full ${SUBJECT_COLORS[subject]}`} />
                    <span className="text-sm font-medium text-foreground">{SUBJECT_LABELS[subject]}</span>
                  </div>
                  <span className="text-sm font-bold text-primary">{r.net.toFixed(1)} net</span>
                </div>
                <div className="mt-2 flex gap-4 text-xs text-muted">
                  <span className="flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                    {r.correct} doğru
                  </span>
                  <span className="flex items-center gap-1">
                    <XCircle className="h-3 w-3 text-red-500" />
                    {r.wrong} yanlış
                  </span>
                  <span>{r.empty} boş</span>
                </div>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-border">
                  <div
                    className="h-full rounded-full bg-primary/70"
                    style={{ width: `${(r.correct / count) * 100}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Answer details */}
      <div className="rounded-2xl border border-border bg-card p-6">
        <h3 className="mb-4 text-lg font-semibold text-foreground">Cevap Anahtarı</h3>
        {SUBJECT_DISTRIBUTION.map(({ subject }) => {
          const [start, end] = getSubjectRange(subject);
          return (
            <div key={subject} className="mb-4 last:mb-0">
              <p className="mb-2 text-xs font-medium text-muted">{SUBJECT_LABELS[subject]}</p>
              <div className="flex flex-wrap gap-1.5">
                {questions.slice(start, end).map((q, qi) => {
                  const globalIdx = start + qi;
                  const userAnswer = answers[globalIdx];
                  const isCorrect = userAnswer === q.correct_index;
                  const isEmpty = userAnswer === null;

                  return (
                    <span
                      key={globalIdx}
                      title={`Soru ${globalIdx + 1}: ${isEmpty ? "Boş" : isCorrect ? "Doğru" : "Yanlış"}`}
                      className={`flex h-7 w-7 items-center justify-center rounded text-[10px] font-semibold ${
                        isEmpty
                          ? "bg-gray-100 text-gray-400"
                          : isCorrect
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-red-100 text-red-700"
                      }`}
                    >
                      {globalIdx + 1}
                    </span>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Matching Schools */}
      <div className="rounded-2xl border border-border bg-card p-6">
        <h3 className="mb-1 flex items-center gap-2 text-lg font-semibold text-foreground">
          <School className="h-5 w-5 text-primary" />
          Sana Uygun Okullar
        </h3>
        <p className="mb-4 text-sm text-muted">
          {estimatedScore.toFixed(2)} puanına göre eşleşen okullar
        </p>

        {loadingSchools ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-24 animate-pulse rounded-xl bg-border" />
            ))}
          </div>
        ) : matchingSchools.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted">
            Bu puan aralığında okul bulunamadı.
          </p>
        ) : (
          <>
            <div className="space-y-3">
              {matchingSchools.slice((schoolPage - 1) * 10, schoolPage * 10).map((school) => {
                const badge = getDifficultyBadge(estimatedScore, school.placement?.min_score ?? 0);
                const years = [2026, 2025, 2024, 2023];
                return (
                  <Link
                    key={school.id}
                    href={`/schools/${school.id}`}
                    className="block rounded-xl border border-border bg-background p-4 transition-all hover:border-primary/30 hover:shadow-sm"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${TYPE_STYLES[school.type] ?? TYPE_STYLES.meslek}`}>
                        {SCHOOL_TYPE_LABELS[school.type] ?? school.type}
                      </span>
                      <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${badge.cls}`}>
                        {badge.label}
                      </span>
                    </div>
                    <p className="mt-1.5 text-sm font-semibold text-foreground">{school.name}</p>
                    <div className="mt-1 flex items-center gap-1 text-xs text-muted">
                      <MapPin className="h-3 w-3" />
                      {school.district}, {school.city}
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {years.map((y) => {
                        const s = school.yearlyScores[y];
                        return (
                          <span key={y} className="rounded bg-card px-2 py-0.5 text-[11px] text-muted">
                            {y}: <span className="font-semibold text-foreground">{s != null ? s.toFixed(2) : "—"}</span>
                          </span>
                        );
                      })}
                    </div>
                  </Link>
                );
              })}
            </div>

            {matchingSchools.length > 10 && (
              <div className="mt-4 flex items-center justify-center gap-2">
                <button
                  onClick={() => setSchoolPage((p) => Math.max(1, p - 1))}
                  disabled={schoolPage === 1}
                  className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-foreground disabled:opacity-30"
                >
                  <ChevronLeft className="h-3 w-3" />
                </button>
                <span className="text-xs text-muted">
                  {schoolPage} / {Math.ceil(matchingSchools.length / 10)}
                </span>
                <button
                  onClick={() => setSchoolPage((p) => Math.min(Math.ceil(matchingSchools.length / 10), p + 1))}
                  disabled={schoolPage >= Math.ceil(matchingSchools.length / 10)}
                  className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-foreground disabled:opacity-30"
                >
                  <ChevronRight className="h-3 w-3" />
                </button>
              </div>
            )}

            <p className="mt-3 text-center text-xs text-muted">
              {matchingSchools.length} okul bulundu
            </p>
          </>
        )}
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <button
          onClick={() => setPhase("intro")}
          className="flex-1 rounded-xl bg-primary py-3 text-sm font-semibold text-white transition-all hover:bg-primary-dark"
        >
          Yeni Deneme Sınavı
        </button>
        <Link
          href="/practice"
          className="flex-1 rounded-xl border border-border py-3 text-center text-sm font-medium text-foreground transition-colors hover:bg-background"
        >
          Alıştırma Moduna Dön
        </Link>
      </div>
    </div>
  );
}

function ResultStat({ label, value, color, bg }: { label: string; value: number; color: string; bg: string }) {
  return (
    <div className={`rounded-xl ${bg} p-3`}>
      <p className={`text-xs ${color}`}>{label}</p>
      <p className={`mt-1 text-xl font-bold ${color}`}>{value}</p>
    </div>
  );
}

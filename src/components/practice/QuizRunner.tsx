"use client";

import { useState } from "react";
import {
  CheckCircle2,
  XCircle,
  RotateCcw,
  ChevronRight,
  Trophy,
} from "lucide-react";
import { createClient } from "@/lib/supabase";
import { SUBJECT_LABELS, SUBJECT_COLORS } from "@/lib/constants";
import ResultStat from "@/components/shared/ResultStat";
import type { Question, Subject } from "@/types/database";

const ALL_SUBJECTS: Subject[] = [
  "turkce",
  "matematik",
  "fen",
  "inkilap",
  "din",
  "yabanciDil",
];

const QUESTION_COUNT = 10;

export default function QuizRunner() {
  const [selectedSubject, setSelectedSubject] = useState<Subject | undefined>();
  const [started, setStarted] = useState(false);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleStart() {
    setLoading(true);
    const supabase = createClient();
    let query = supabase.from("questions").select("*");
    if (selectedSubject) query = query.eq("subject", selectedSubject);
    const { data } = await query;

    if (!data || data.length === 0) {
      setLoading(false);
      return;
    }

    const shuffled = [...data].sort(() => Math.random() - 0.5);
    setQuestions(shuffled.slice(0, Math.min(QUESTION_COUNT, shuffled.length)));
    setCurrentIndex(0);
    setSelectedAnswer(null);
    setConfirmed(false);
    setScore(0);
    setFinished(false);
    setStarted(true);
    setLoading(false);
  }

  function handleConfirm() {
    if (selectedAnswer === null) return;
    setConfirmed(true);
    if (selectedAnswer === questions[currentIndex].correct_index) {
      setScore((s) => s + 1);
    }
  }

  function handleNext() {
    if (currentIndex + 1 >= questions.length) {
      setFinished(true);
    } else {
      setCurrentIndex((i) => i + 1);
      setSelectedAnswer(null);
      setConfirmed(false);
    }
  }

  function handleRestart() {
    setStarted(false);
    setFinished(false);
  }

  if (!started) {
    return (
      <div className="space-y-6">
        <div className="rounded-2xl border border-border bg-card p-6">
          <h2 className="mb-4 text-lg font-semibold text-foreground">
            Ders Seç
          </h2>
          <p className="mb-4 text-sm text-muted">
            Bir ders seç veya tüm derslerden karışık çöz.
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedSubject(undefined)}
              className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                selectedSubject === undefined
                  ? "bg-primary text-white"
                  : "bg-background text-muted hover:bg-primary/5 hover:text-foreground"
              }`}
            >
              Karışık
            </button>
            {ALL_SUBJECTS.map((s) => (
              <button
                key={s}
                onClick={() => setSelectedSubject(s)}
                className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                  selectedSubject === s
                    ? "bg-primary text-white"
                    : "bg-background text-muted hover:bg-primary/5 hover:text-foreground"
                }`}
              >
                {SUBJECT_LABELS[s]}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={handleStart}
          disabled={loading}
          className="w-full rounded-xl bg-primary py-3.5 text-sm font-semibold text-white shadow-lg shadow-primary/25 transition-all hover:bg-primary-dark hover:shadow-xl disabled:opacity-50"
        >
          {loading ? "Sorular yükleniyor..." : `Alıştırmaya Başla (${QUESTION_COUNT} Soru)`}
        </button>
      </div>
    );
  }

  if (finished) {
    const percentage = Math.round((score / questions.length) * 100);
    return (
      <div className="rounded-2xl border border-border bg-card p-6 text-center">
        <div className="mx-auto mb-4 inline-flex rounded-full bg-primary/10 p-4">
          <Trophy className="h-8 w-8 text-primary" />
        </div>
        <h2 className="text-xl font-bold text-foreground">Alıştırma Bitti!</h2>
        <p className="mt-2 text-sm text-muted">
          {questions.length} sorudan {score} doğru
        </p>

        <div className="mx-auto mt-4 max-w-xs">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted">Başarı</span>
            <span className="font-semibold text-foreground">%{percentage}</span>
          </div>
          <div className="mt-1.5 h-3 overflow-hidden rounded-full bg-border">
            <div
              className={`h-full rounded-full transition-all ${
                percentage >= 70
                  ? "bg-emerald-500"
                  : percentage >= 40
                    ? "bg-amber-500"
                    : "bg-red-500"
              }`}
              style={{ width: `${percentage}%` }}
            />
          </div>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <ResultStat
            label="Doğru"
            value={score}
            color="text-emerald-600"
            bg="bg-emerald-50"
          />
          <ResultStat
            label="Yanlış"
            value={questions.length - score}
            color="text-red-600"
            bg="bg-red-50"
          />
          <ResultStat
            label="Net"
            value={score}
            color="text-primary"
            bg="bg-indigo-50"
          />
        </div>

        <button
          onClick={handleRestart}
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-white transition-all hover:bg-primary-dark"
        >
          <RotateCcw className="h-4 w-4" />
          Tekrar Çöz
        </button>
      </div>
    );
  }

  const q = questions[currentIndex];
  const isCorrect = confirmed && selectedAnswer === q.correct_index;
  const isWrong = confirmed && selectedAnswer !== q.correct_index;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span
            className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold text-white ${SUBJECT_COLORS[q.subject]}`}
          >
            {SUBJECT_LABELS[q.subject]}
          </span>
          <span className="text-sm text-muted">
            {currentIndex + 1} / {questions.length}
          </span>
        </div>
        <span className="text-sm font-medium text-foreground">
          {score} doğru
        </span>
      </div>

      <div className="h-1.5 overflow-hidden rounded-full bg-border">
        <div
          className="h-full rounded-full bg-primary transition-all"
          style={{
            width: `${((currentIndex + 1) / questions.length) * 100}%`,
          }}
        />
      </div>

      <div className="rounded-2xl border border-border bg-card p-6">
        <p className="text-base font-medium text-foreground">{q.text}</p>

        <div className="mt-4 space-y-2">
          {(q.options as string[]).map((option, i) => {
            let style =
              "border-border bg-background text-foreground hover:border-primary/30";

            if (confirmed) {
              if (i === q.correct_index) {
                style =
                  "border-emerald-500 bg-emerald-50 text-emerald-800";
              } else if (i === selectedAnswer && i !== q.correct_index) {
                style = "border-red-500 bg-red-50 text-red-800";
              } else {
                style = "border-border bg-background text-muted opacity-50";
              }
            } else if (selectedAnswer === i) {
              style = "border-primary bg-primary/5 text-foreground";
            }

            return (
              <button
                key={i}
                onClick={() => !confirmed && setSelectedAnswer(i)}
                disabled={confirmed}
                className={`flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left text-sm transition-all ${style}`}
              >
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-current text-xs font-semibold">
                  {String.fromCharCode(65 + i)}
                </span>
                <span>{option}</span>
                {confirmed && i === q.correct_index && (
                  <CheckCircle2 className="ml-auto h-5 w-5 text-emerald-600" />
                )}
                {confirmed &&
                  i === selectedAnswer &&
                  i !== q.correct_index && (
                    <XCircle className="ml-auto h-5 w-5 text-red-500" />
                  )}
              </button>
            );
          })}
        </div>
      </div>

      {!confirmed ? (
        <button
          onClick={handleConfirm}
          disabled={selectedAnswer === null}
          className="w-full rounded-xl bg-primary py-3 text-sm font-semibold text-white shadow-lg shadow-primary/25 transition-all hover:bg-primary-dark disabled:opacity-40 disabled:shadow-none"
        >
          Cevabı Kontrol Et
        </button>
      ) : (
        <div className="space-y-3">
          {isCorrect && (
            <p className="rounded-xl bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-700">
              Doğru!
            </p>
          )}
          {isWrong && (
            <p className="rounded-xl bg-red-50 px-4 py-2 text-sm font-medium text-red-700">
              Yanlış. Doğru cevap:{" "}
              <span className="font-bold">
                {String.fromCharCode(65 + q.correct_index)}) {(q.options as string[])[q.correct_index]}
              </span>
            </p>
          )}
          <button
            onClick={handleNext}
            className="flex w-full items-center justify-center gap-1 rounded-xl bg-primary py-3 text-sm font-semibold text-white transition-all hover:bg-primary-dark"
          >
            {currentIndex + 1 >= questions.length
              ? "Sonuçları Gör"
              : "Sonraki Soru"}
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}


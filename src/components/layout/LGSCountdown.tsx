"use client";

import { useState, useEffect, useRef } from "react";
import { CalendarDays } from "lucide-react";

const LGS_TS = Date.parse("2027-06-06T10:00:00+03:00");

function calcRemaining() {
  const diff = LGS_TS - Date.now();
  if (diff <= 0) return null;
  return {
    days: Math.floor(diff / 86400000),
    hours: Math.floor((diff / 3600000) % 24),
    minutes: Math.floor((diff / 60000) % 60),
    seconds: Math.floor((diff / 1000) % 60),
  };
}

export default function LGSCountdown() {
  const [remaining, setRemaining] = useState<ReturnType<typeof calcRemaining>>(null);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setRemaining(calcRemaining());
    const id = setInterval(() => setRemaining(calcRemaining()), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  if (!remaining) return null;

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-semibold text-primary transition-colors hover:bg-primary/5"
      >
        <CalendarDays className="h-3.5 w-3.5" />
        <span className="tabular-nums">{remaining.days}g {remaining.hours}s</span>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-3 w-64 rounded-xl border border-border bg-card p-4 shadow-xl z-50">
          <div className="mb-2 flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-primary" />
            <p className="text-xs font-semibold text-foreground">
              2027 LGS&apos;ye Kalan Süre
            </p>
          </div>
          <p className="mb-3 text-[10px] text-muted">
            6 Haziran 2027 Pazar · Saat 10:00
          </p>
          <div className="grid grid-cols-4 gap-1.5">
            <TimeBox value={remaining.days} label="Gün" />
            <TimeBox value={remaining.hours} label="Saat" />
            <TimeBox value={remaining.minutes} label="Dk" />
            <TimeBox value={remaining.seconds} label="Sn" />
          </div>
        </div>
      )}
    </div>
  );
}

function TimeBox({ value, label }: { value: number; label: string }) {
  return (
    <div className="rounded-lg bg-primary/5 py-2 text-center">
      <p className="text-lg font-black tabular-nums text-primary">
        {String(value).padStart(2, "0")}
      </p>
      <p className="text-[9px] font-medium text-muted">{label}</p>
    </div>
  );
}

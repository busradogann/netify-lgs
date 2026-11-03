"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { LogIn, UserPlus, Mail, Lock, User, AlertCircle, CheckCircle2, BookOpen, School, Calculator, Trophy } from "lucide-react";
import { login, signup } from "@/app/login/actions";

const loadingTips = [
  { icon: BookOpen, text: "Binlerce soru ile LGS'ye hazırlan!" },
  { icon: School, text: "Türkiye'deki tüm liseleri karşılaştır." },
  { icon: Calculator, text: "Puan hesaplama ile sıralamandaki yerini öğren." },
  { icon: Trophy, text: "Deneme sınavları ile kendini test et!" },
];

export default function LoginForm() {
  const searchParams = useSearchParams();
  const initialTab = searchParams.get("tab") === "signup" ? "signup" : "login";
  const error = searchParams.get("error");
  const message = searchParams.get("message");

  const [tab, setTab] = useState<"login" | "signup">(initialTab);
  const [loading, setLoading] = useState(false);
  const [tipIndex, setTipIndex] = useState(0);

  useEffect(() => {
    if (!loading) return;
    const interval = setInterval(() => {
      setTipIndex((prev) => (prev + 1) % loadingTips.length);
    }, 2000);
    return () => clearInterval(interval);
  }, [loading]);

  function handleSubmit() {
    setLoading(true);
  }

  const currentTip = loadingTips[tipIndex];

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-10">
        <div className="relative mb-6">
          <div className="h-14 w-14 animate-spin rounded-full border-4 border-primary/20 border-t-primary" />
          <div className="absolute inset-0 flex items-center justify-center">
            <currentTip.icon className="h-5 w-5 text-primary animate-pulse" />
          </div>
        </div>
        <p className="mb-2 text-sm font-semibold text-foreground">
          {tab === "login" ? "Giriş yapılıyor..." : "Hesap oluşturuluyor..."}
        </p>
        <p
          key={tipIndex}
          className="text-center text-sm text-muted animate-[fadeInUp_0.4s_ease-out]"
        >
          {currentTip.text}
        </p>
        <div className="mt-6 flex gap-1.5">
          {loadingTips.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === tipIndex ? "w-6 bg-primary" : "w-1.5 bg-primary/20"
              }`}
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex rounded-xl bg-background p-1">
        <button
          onClick={() => setTab("login")}
          className={`flex-1 rounded-lg py-2.5 text-sm font-semibold transition-all ${
            tab === "login"
              ? "bg-card text-foreground shadow-sm"
              : "text-muted hover:text-foreground"
          }`}
        >
          Giriş Yap
        </button>
        <button
          onClick={() => setTab("signup")}
          className={`flex-1 rounded-lg py-2.5 text-sm font-semibold transition-all ${
            tab === "signup"
              ? "bg-card text-foreground shadow-sm"
              : "text-muted hover:text-foreground"
          }`}
        >
          Kayıt Ol
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {message && (
        <div className="flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{message}</span>
        </div>
      )}

      {tab === "login" ? (
        <form action={login} onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="login-email"
              className="mb-1.5 block text-sm font-medium text-foreground"
            >
              E-posta
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
              <input
                id="login-email"
                name="email"
                type="email"
                required
                placeholder="ornek@email.com"
                className="w-full rounded-xl border border-border bg-background py-3 pl-10 pr-4 text-sm text-foreground outline-none transition-colors placeholder:text-muted focus:border-primary"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="login-password"
              className="mb-1.5 block text-sm font-medium text-foreground"
            >
              Şifre
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
              <input
                id="login-password"
                name="password"
                type="password"
                required
                minLength={6}
                placeholder="En az 6 karakter"
                className="w-full rounded-xl border border-border bg-background py-3 pl-10 pr-4 text-sm text-foreground outline-none transition-colors placeholder:text-muted focus:border-primary"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-semibold text-white shadow-lg shadow-primary/25 transition-all hover:bg-primary-dark disabled:opacity-50"
          >
            <LogIn className="h-4 w-4" />
            {loading ? "Giriş yapılıyor..." : "Giriş Yap"}
          </button>
        </form>
      ) : (
        <form action={signup} onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="signup-name"
              className="mb-1.5 block text-sm font-medium text-foreground"
            >
              Ad Soyad
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
              <input
                id="signup-name"
                name="fullName"
                type="text"
                required
                placeholder="Adınız Soyadınız"
                className="w-full rounded-xl border border-border bg-background py-3 pl-10 pr-4 text-sm text-foreground outline-none transition-colors placeholder:text-muted focus:border-primary"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="signup-email"
              className="mb-1.5 block text-sm font-medium text-foreground"
            >
              E-posta
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
              <input
                id="signup-email"
                name="email"
                type="email"
                required
                placeholder="ornek@email.com"
                className="w-full rounded-xl border border-border bg-background py-3 pl-10 pr-4 text-sm text-foreground outline-none transition-colors placeholder:text-muted focus:border-primary"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="signup-password"
              className="mb-1.5 block text-sm font-medium text-foreground"
            >
              Şifre
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
              <input
                id="signup-password"
                name="password"
                type="password"
                required
                minLength={6}
                placeholder="En az 6 karakter"
                className="w-full rounded-xl border border-border bg-background py-3 pl-10 pr-4 text-sm text-foreground outline-none transition-colors placeholder:text-muted focus:border-primary"
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">
              Hesap Türü
            </label>
            <div className="flex gap-3">
              <label className="flex flex-1 cursor-pointer items-center gap-2 rounded-xl border border-border bg-background px-4 py-3 text-sm transition-colors has-[:checked]:border-primary has-[:checked]:bg-primary/5">
                <input
                  type="radio"
                  name="role"
                  value="ogrenci"
                  defaultChecked
                  className="accent-primary"
                />
                <span className="font-medium text-foreground">Öğrenci</span>
              </label>
              <label className="flex flex-1 cursor-pointer items-center gap-2 rounded-xl border border-border bg-background px-4 py-3 text-sm transition-colors has-[:checked]:border-primary has-[:checked]:bg-primary/5">
                <input
                  type="radio"
                  name="role"
                  value="ebeveyn"
                  className="accent-primary"
                />
                <span className="font-medium text-foreground">Ebeveyn</span>
              </label>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-semibold text-white shadow-lg shadow-primary/25 transition-all hover:bg-primary-dark disabled:opacity-50"
          >
            <UserPlus className="h-4 w-4" />
            {loading ? "Kayıt oluşturuluyor..." : "Kayıt Ol"}
          </button>
        </form>
      )}
    </div>
  );
}

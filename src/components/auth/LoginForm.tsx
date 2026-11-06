"use client";

import { useState, useActionState } from "react";
import { LogIn, UserPlus, Mail, Lock, User, AlertCircle, CheckCircle2 } from "lucide-react";
import { login, signup } from "@/app/login/actions";

export default function LoginForm() {
  const [tab, setTab] = useState<"login" | "signup">("login");
  const [loginState, loginAction, loginPending] = useActionState(login, null);
  const [signupState, signupAction, signupPending] = useActionState(signup, null);

  const error = tab === "login" ? loginState?.error : signupState?.error;
  const message = tab === "signup" && signupState?.message ? signupState.message : null;

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
        <div className="flex items-center gap-2 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-950/30 dark:text-red-400">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {message && (
        <div className="flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{message}</span>
        </div>
      )}

      {tab === "login" ? (
        <form action={loginAction} className="space-y-4">
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
            disabled={loginPending}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-semibold text-white shadow-lg shadow-primary/25 transition-all hover:bg-primary-dark disabled:opacity-50"
          >
            {loginPending ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            ) : (
              <LogIn className="h-4 w-4" />
            )}
            {loginPending ? "Giriş yapılıyor..." : "Giriş Yap"}
          </button>
        </form>
      ) : (
        <form action={signupAction} className="space-y-4">
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
            disabled={signupPending}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-semibold text-white shadow-lg shadow-primary/25 transition-all hover:bg-primary-dark disabled:opacity-50"
          >
            {signupPending ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            ) : (
              <UserPlus className="h-4 w-4" />
            )}
            {signupPending ? "Kayıt oluşturuluyor..." : "Kayıt Ol"}
          </button>
        </form>
      )}
    </div>
  );
}

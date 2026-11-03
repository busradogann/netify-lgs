"use client";

import { useState } from "react";
import { User as UserIcon, Mail, Target, LogOut, Save, CheckCircle2 } from "lucide-react";
import type { User } from "@supabase/supabase-js";
import type { Profile } from "@/types/database";
import { createClient } from "@/lib/supabase";
import { logout } from "@/app/login/actions";
import { formatRanking } from "@/lib/utils";

interface ProfileViewProps {
  user: User;
  profile: Profile | null;
}

export default function ProfileView({ user, profile }: ProfileViewProps) {
  const [fullName, setFullName] = useState(profile?.full_name ?? "");
  const [role, setRole] = useState<"ogrenci" | "ebeveyn">(
    profile?.role ?? "ogrenci"
  );
  const [targetRanking, setTargetRanking] = useState(
    profile?.target_ranking ? formatRanking(profile.target_ranking) : ""
  );
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleSave() {
    setSaving(true);
    setSaved(false);

    const supabase = createClient();
    const ranking = targetRanking
      ? Number(targetRanking.replace(/\D/g, ""))
      : null;

    await supabase
      .from("profiles")
      .upsert({
        id: user.id,
        full_name: fullName,
        role,
        target_ranking: ranking,
      });

    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  function handleRankingChange(value: string) {
    const digits = value.replace(/\D/g, "");
    if (digits === "") {
      setTargetRanking("");
      return;
    }
    const num = Number(digits);
    if (num > 1_500_000) return;
    setTargetRanking(num.toLocaleString("tr-TR"));
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="mx-auto mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
          <UserIcon className="h-8 w-8 text-primary" />
        </div>
        <h1 className="text-2xl font-bold text-foreground">Profilim</h1>
        <div className="mt-1 flex items-center justify-center gap-1 text-sm text-muted">
          <Mail className="h-3.5 w-3.5" />
          <span>{user.email}</span>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card p-6">
        <h2 className="mb-4 text-lg font-semibold text-foreground">
          Profil Bilgileri
        </h2>

        <div className="space-y-4">
          <div>
            <label
              htmlFor="fullName"
              className="mb-1.5 block text-sm font-medium text-foreground"
            >
              Ad Soyad
            </label>
            <input
              id="fullName"
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted focus:border-primary"
            />
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
                  checked={role === "ogrenci"}
                  onChange={() => setRole("ogrenci")}
                  className="accent-primary"
                />
                <span className="font-medium text-foreground">Öğrenci</span>
              </label>
              <label className="flex flex-1 cursor-pointer items-center gap-2 rounded-xl border border-border bg-background px-4 py-3 text-sm transition-colors has-[:checked]:border-primary has-[:checked]:bg-primary/5">
                <input
                  type="radio"
                  name="role"
                  checked={role === "ebeveyn"}
                  onChange={() => setRole("ebeveyn")}
                  className="accent-primary"
                />
                <span className="font-medium text-foreground">Ebeveyn</span>
              </label>
            </div>
          </div>

          <div>
            <label
              htmlFor="targetRanking"
              className="mb-1.5 block text-sm font-medium text-foreground"
            >
              <span className="flex items-center gap-1.5">
                <Target className="h-4 w-4 text-primary" />
                Hedef Sıralama
              </span>
            </label>
            <input
              id="targetRanking"
              type="text"
              inputMode="numeric"
              value={targetRanking}
              onChange={(e) => handleRankingChange(e.target.value)}
              onFocus={(e) => e.target.select()}
              placeholder="Örn: 5.000"
              className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted focus:border-primary"
            />
            <p className="mt-1 text-xs text-muted">
              Hedef sıralamanı gir, okul eşleştirmesinde kullanılsın.
            </p>
          </div>
        </div>

        <div className="mt-6 flex items-center gap-3">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 rounded-xl bg-primary px-6 py-2.5 text-sm font-semibold text-white transition-all hover:bg-primary-dark disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            {saving ? "Kaydediliyor..." : "Kaydet"}
          </button>
          {saved && (
            <span className="flex items-center gap-1 text-sm text-emerald-600">
              <CheckCircle2 className="h-4 w-4" />
              Kaydedildi
            </span>
          )}
        </div>
      </div>

      <form action={logout}>
        <button
          type="submit"
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 py-3 text-sm font-semibold text-red-600 transition-all hover:bg-red-100"
        >
          <LogOut className="h-4 w-4" />
          Çıkış Yap
        </button>
      </form>
    </div>
  );
}

"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import type { Profile } from "@/types/database";
import { createClient } from "@/lib/supabase";

interface UserState {
  loading: boolean;
  userId: string | null;
  email: string | null;
  profile: Profile | null;
  favoriteIds: Set<string>;
  toggleFavorite: (schoolId: string) => Promise<void>;
}

const UserContext = createContext<UserState>({
  loading: true,
  userId: null,
  email: null,
  profile: null,
  favoriteIds: new Set(),
  toggleFavorite: async () => {},
});

export function useUser() {
  return useContext(UserContext);
}

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [base, setBase] = useState<Omit<UserState, "favoriteIds" | "toggleFavorite">>({
    loading: true,
    userId: null,
    email: null,
    profile: null,
  });
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    const supabase = createClient();

    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setBase({ loading: false, userId: null, email: null, profile: null });
        setFavoriteIds(new Set());
        return;
      }

      const [{ data: profile }, { data: favs }] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", user.id).single(),
        supabase.from("favorites").select("school_id").eq("user_id", user.id),
      ]);

      setBase({
        loading: false,
        userId: user.id,
        email: user.email ?? null,
        profile: profile ?? null,
      });
      setFavoriteIds(new Set((favs ?? []).map((f: any) => f.school_id)));
    }

    load();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      load();
    });

    return () => subscription.unsubscribe();
  }, []);

  const toggleFavorite = useCallback(async (schoolId: string) => {
    if (!base.userId) return;
    const supabase = createClient();
    const isFav = favoriteIds.has(schoolId);

    if (isFav) {
      setFavoriteIds((prev) => { const next = new Set(prev); next.delete(schoolId); return next; });
      await supabase.from("favorites").delete().eq("user_id", base.userId).eq("school_id", schoolId);
    } else {
      setFavoriteIds((prev) => new Set(prev).add(schoolId));
      await supabase.from("favorites").insert({ user_id: base.userId, school_id: schoolId });
    }
  }, [base.userId, favoriteIds]);

  return (
    <UserContext value={{ ...base, favoriteIds, toggleFavorite }}>
      {children}
    </UserContext>
  );
}

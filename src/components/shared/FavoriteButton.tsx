"use client";

import { Heart } from "lucide-react";
import { useUser } from "@/lib/user-context";
import { useRouter } from "next/navigation";

interface FavoriteButtonProps {
  schoolId: string;
  size?: "sm" | "md";
}

export default function FavoriteButton({ schoolId, size = "sm" }: FavoriteButtonProps) {
  const { userId, favoriteIds, toggleFavorite } = useUser();
  const router = useRouter();
  const isFav = favoriteIds.has(schoolId);

  async function handleClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();

    if (!userId) {
      router.push("/login");
      return;
    }

    await toggleFavorite(schoolId);
  }

  const iconSize = size === "sm" ? "h-4 w-4" : "h-5 w-5";
  const btnSize = size === "sm" ? "p-1.5" : "p-2";

  return (
    <button
      onClick={handleClick}
      title={isFav ? "Favorilerden çıkar" : "Favorilere ekle"}
      className={`rounded-lg ${btnSize} transition-colors ${
        isFav
          ? "text-red-500 hover:bg-red-50"
          : "text-muted hover:bg-background hover:text-red-400"
      }`}
    >
      <Heart
        className={`${iconSize} transition-all ${isFav ? "fill-current" : ""}`}
      />
    </button>
  );
}

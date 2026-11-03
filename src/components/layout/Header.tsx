"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { Menu, X, GraduationCap, Sun, Moon, User, LogOut, Lock } from "lucide-react";
import { useUser } from "@/lib/user-context";
import LGSCountdown from "./LGSCountdown";

const navItems = [
  { href: "/calculate", label: "Hesapla", studentOnly: false },
  { href: "/schools", label: "Okullar", studentOnly: false },
  { href: "/practice", label: "Alıştırma", studentOnly: true },
  { href: "/favorites", label: "Favoriler", studentOnly: false },
];

function useTheme() {
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    const stored = localStorage.getItem("theme");
    if (stored === "dark" || stored === "light") {
      setTheme(stored);
      document.documentElement.setAttribute("data-theme", stored);
    } else if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
      setTheme("dark");
    }
  }, []);

  function toggle() {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.setAttribute("data-theme", next);
    localStorage.setItem("theme", next);
  }

  return { theme, toggle };
}

function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp("(?:^|; )" + name + "=([^;]*)"));
  return match ? match[1] : null;
}

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { userId, loading: userLoading, email, profile } = useUser();
  const isLoggedIn = getCookie("loggedIn") === "true" || !!userId;
  const { theme, toggle: toggleTheme } = useTheme();
  const router = useRouter();
  const isParent = profile?.role === "ebeveyn";

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-card/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2">
          <GraduationCap className="h-6 w-6 text-primary" />
          <span className="text-lg font-bold text-foreground">Netify</span>
          <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
            LGS
          </span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {navItems.map((item) => {
            const disabled = item.studentOnly && isParent;
            if (disabled) {
              return (
                <span
                  key={item.href}
                  className="flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium text-muted/50 cursor-not-allowed"
                  title="Bu bölüm öğrencilere özeldir"
                >
                  <Lock className="h-3 w-3" />
                  {item.label}
                </span>
              );
            }
            return (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-lg px-3 py-2 text-sm font-medium text-muted transition-colors hover:bg-primary/5 hover:text-foreground"
              >
                {item.label}
              </Link>
            );
          })}
          <LGSCountdown />
          <button
            onClick={toggleTheme}
            className="ml-1 rounded-lg p-2 text-muted transition-colors hover:bg-primary/5 hover:text-foreground"
            aria-label="Tema değiştir"
          >
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
          {isLoggedIn ? (
            <Link
              href="/profile"
              className="ml-1 flex items-center gap-1.5 rounded-lg bg-primary/10 px-3 py-2 text-sm font-semibold text-primary transition-colors hover:bg-primary/20"
            >
              <User className="h-4 w-4" />
              Profil
            </Link>
          ) : userLoading ? (
            <div className="ml-1 h-9 w-20 animate-pulse rounded-lg bg-primary/10" />
          ) : (
            <Link
              href="/login"
              className="ml-1 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-dark"
            >
              Giriş Yap
            </Link>
          )}
        </nav>

        <div className="flex items-center gap-1 md:hidden">
          <LGSCountdown />
          <button
            onClick={toggleTheme}
            className="rounded-lg p-2 text-muted hover:bg-primary/5"
            aria-label="Tema değiştir"
          >
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="rounded-lg p-2 text-muted hover:bg-primary/5"
            aria-label="Menü"
          >
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {menuOpen && (
        <nav className="border-t border-border bg-card px-4 pb-4 md:hidden">
          {navItems.map((item) => {
            const disabled = item.studentOnly && isParent;
            if (disabled) {
              return (
                <span
                  key={item.href}
                  className="flex items-center gap-1 rounded-lg px-3 py-3 text-sm font-medium text-muted/50 cursor-not-allowed"
                >
                  <Lock className="h-3 w-3" />
                  {item.label}
                  <span className="ml-auto text-[10px]">Öğrencilere özel</span>
                </span>
              );
            }
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMenuOpen(false)}
                className="block rounded-lg px-3 py-3 text-sm font-medium text-muted hover:bg-primary/5 hover:text-foreground"
              >
                {item.label}
              </Link>
            );
          })}
          {isLoggedIn ? (
            <Link
              href="/profile"
              onClick={() => setMenuOpen(false)}
              className="mt-2 flex items-center justify-center gap-2 rounded-lg bg-primary/10 px-4 py-3 text-sm font-semibold text-primary"
            >
              <User className="h-4 w-4" />
              Profil
            </Link>
          ) : userLoading ? (
            <div className="mt-2 h-11 animate-pulse rounded-lg bg-primary/10" />
          ) : (
            <Link
              href="/login"
              onClick={() => setMenuOpen(false)}
              className="mt-2 block rounded-lg bg-primary px-4 py-3 text-center text-sm font-semibold text-white hover:bg-primary-dark"
            >
              Giriş Yap
            </Link>
          )}
        </nav>
      )}
    </header>
  );
}

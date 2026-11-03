import { GraduationCap } from "lucide-react";
import Link from "next/link";

export default function Footer() {
  return (
    <footer className="mt-auto border-t border-border bg-card">
      <div className="mx-auto max-w-5xl px-4 py-8">
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
          <div className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5 text-primary" />
            <span className="font-semibold text-foreground">Netify LGS</span>
          </div>
          <nav className="flex gap-4 text-sm text-muted">
            <Link href="/calculate" className="hover:text-foreground">
              Hesapla
            </Link>
            <Link href="/schools" className="hover:text-foreground">
              Okullar
            </Link>
            <Link href="/practice" className="hover:text-foreground">
              Alıştırma
            </Link>
          </nav>
        </div>
        <p className="mt-4 text-center text-xs text-muted">
          &copy; 2026 Netify. Tüm hakları saklıdır. Bu
          site resmi MEB platformu değildir.
        </p>
      </div>
    </footer>
  );
}

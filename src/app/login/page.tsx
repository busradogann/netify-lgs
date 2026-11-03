import type { Metadata } from "next";
import { Suspense } from "react";
import { GraduationCap } from "lucide-react";
import LoginForm from "@/components/auth/LoginForm";

export const metadata: Metadata = {
  title: "Giriş Yap",
  description: "Netify LGS hesabına giriş yap veya yeni hesap oluştur.",
};

export default function LoginPage() {
  return (
    <div className="mx-auto max-w-md px-4 py-12">
      <div className="mb-8 text-center">
        <div className="mx-auto mb-4 inline-flex rounded-2xl bg-primary/10 p-3">
          <GraduationCap className="h-6 w-6 text-primary" />
        </div>
        <h1 className="text-2xl font-bold text-foreground">Netify LGS</h1>
        <p className="mt-2 text-sm text-muted">
          Hesabına giriş yap veya yeni hesap oluştur.
        </p>
      </div>

      <div className="rounded-2xl border border-border bg-card p-6">
        <Suspense>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}

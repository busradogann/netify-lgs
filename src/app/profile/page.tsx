import type { Metadata } from "next";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import ProfileView from "@/components/profile/ProfileView";

export const metadata: Metadata = {
  title: "Profil",
  description: "Profil bilgilerini görüntüle ve düzenle.",
};

async function ProfileContent() {
  await connection();
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  return <ProfileView user={user} profile={profile} />;
}

function LoadingSkeleton() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="flex flex-col items-center">
        <div className="h-16 w-16 rounded-full bg-border" />
        <div className="mt-4 h-6 w-32 rounded bg-border" />
        <div className="mt-2 h-4 w-48 rounded bg-border" />
      </div>
      <div className="rounded-2xl border border-border bg-card p-6">
        <div className="space-y-4">
          <div className="h-12 rounded-xl bg-border" />
          <div className="h-12 rounded-xl bg-border" />
          <div className="h-12 rounded-xl bg-border" />
        </div>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <Suspense fallback={<LoadingSkeleton />}>
        <ProfileContent />
      </Suspense>
    </div>
  );
}

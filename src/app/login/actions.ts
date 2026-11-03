"use server";

import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase-server";

export async function login(formData: FormData) {
  let errorMessage: string | null = null;

  try {
    const supabase = await createServerSupabaseClient();

    const { error } = await supabase.auth.signInWithPassword({
      email: formData.get("email") as string,
      password: formData.get("password") as string,
    });

    if (error) {
      errorMessage = error.message;
    }
  } catch (e) {
    errorMessage = "Bir hata oluştu. Lütfen tekrar deneyin.";
  }

  if (errorMessage) {
    redirect(`/login?error=${encodeURIComponent(errorMessage)}`);
  }

  redirect("/profile");
}

export async function signup(formData: FormData) {
  let errorMessage: string | null = null;

  try {
    const supabase = await createServerSupabaseClient();

    const { error } = await supabase.auth.signUp({
      email: formData.get("email") as string,
      password: formData.get("password") as string,
      options: {
        data: {
          full_name: formData.get("fullName") as string,
          role: formData.get("role") as string,
        },
      },
    });

    if (error) {
      errorMessage = error.message;
    }
  } catch (e) {
    errorMessage = "Bir hata oluştu. Lütfen tekrar deneyin.";
  }

  if (errorMessage) {
    redirect(`/login?error=${encodeURIComponent(errorMessage)}&tab=signup`);
  }

  redirect(`/login?message=${encodeURIComponent("Kayıt başarılı! E-postanı kontrol et.")}`);
}

export async function logout() {
  const supabase = await createServerSupabaseClient();
  await supabase.auth.signOut();
  redirect("/");
}

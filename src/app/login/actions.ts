"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase-server";

export async function login(_prevState: { error: string } | null, formData: FormData) {
  try {
    const supabase = await createServerSupabaseClient();

    const { error } = await supabase.auth.signInWithPassword({
      email: formData.get("email") as string,
      password: formData.get("password") as string,
    });

    if (error) {
      const msg = error.message;
      if (msg.includes("Invalid login credentials")) {
        return { error: "E-posta veya şifre hatalı." };
      }
      if (msg.includes("is not valid JSON") || msg.includes("<!DOCTYPE")) {
        return { error: "Sunucuya bağlanılamadı. Lütfen daha sonra tekrar deneyin." };
      }
      return { error: msg };
    }
  } catch {
    return { error: "Bir hata oluştu. Lütfen tekrar deneyin." };
  }

  const cookieStore = await cookies();
  cookieStore.set("loggedIn", "true", { path: "/", httpOnly: false, maxAge: 60 * 60 * 24 * 30 });

  redirect("/profile");
}

export async function signup(_prevState: { error: string; message?: string } | null, formData: FormData) {
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
      if (error.message.includes("is not valid JSON") || error.message.includes("<!DOCTYPE")) {
        return { error: "Sunucuya bağlanılamadı. Lütfen daha sonra tekrar deneyin." };
      }
      return { error: error.message };
    }
  } catch {
    return { error: "Bir hata oluştu. Lütfen tekrar deneyin." };
  }

  return { error: "", message: "Kayıt başarılı! E-postanı kontrol et." };
}

export async function logout() {
  const supabase = await createServerSupabaseClient();
  await supabase.auth.signOut();

  const cookieStore = await cookies();
  cookieStore.set("loggedIn", "false", { path: "/", httpOnly: false, maxAge: 60 * 60 * 24 * 30 });

  redirect("/");
}

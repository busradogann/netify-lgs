import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/profile";

  if (code) {
    const supabase = await createServerSupabaseClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const response = NextResponse.redirect(`${origin}${next}`);
      response.cookies.set("loggedIn", "true", { path: "/", httpOnly: false, maxAge: 60 * 60 * 24 * 30 });
      return response;
    }
  }

  return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent("Doğrulama başarısız")}`);
}

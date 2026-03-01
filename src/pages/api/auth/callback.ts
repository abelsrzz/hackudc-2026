import type { APIRoute } from "astro";
import { supabase, supabaseAdmin } from "../../../lib/supabase";

export const GET: APIRoute = async ({ url, cookies, redirect }) => {
  const authCode = url.searchParams.get("code");

  if (!authCode) {
    return new Response("No se proporcionó ningún código", { status: 400 });
  }

  const { data, error } = await supabase.auth.exchangeCodeForSession(authCode);

  if (error) {
    return new Response(error.message, { status: 500 });
  }

  const { access_token, refresh_token } = data.session;
  const user = data.user;

  // Para usuarios OAuth (GitHub, etc.) crear/actualizar perfil si no existe
  if (user) {
    const meta = user.user_metadata ?? {};
    const name: string =
      meta.full_name ?? meta.name ?? meta.user_name ?? user.email ?? "";
    const avatarUrl: string | null = meta.avatar_url ?? null;
    const githubHandle: string | null =
      meta.user_name ?? meta.preferred_username ?? null;
    const githubUrl = githubHandle
      ? `https://github.com/${githubHandle}`
      : null;

    // upsert: crea el perfil si no existía (registro vía OAuth)
    // ignoreSame: si ya existía, no sobreescribimos campos que el usuario pudo haber editado
    const { data: existing } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .eq("id", user.id)
      .maybeSingle();

    if (!existing) {
      await supabaseAdmin.from("profiles").insert({
        id: user.id,
        name,
        role: "Hacker",
        avatar_url: avatarUrl,
        github: githubUrl,
      });
    }
  }

  cookies.set("sb-access-token", access_token, { path: "/" });
  cookies.set("sb-refresh-token", refresh_token, { path: "/" });

  return redirect("/dashboard");
};

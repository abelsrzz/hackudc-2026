import type { APIRoute } from "astro";
import { supabaseAdmin } from "../../../lib/supabase";

export const POST: APIRoute = async ({ request, cookies }) => {
  const { access_token, refresh_token } = await request.json();

  if (!access_token || !refresh_token) {
    return new Response("Tokens requeridos", { status: 400 });
  }

  cookies.set("sb-access-token", access_token, { path: "/" });
  cookies.set("sb-refresh-token", refresh_token, { path: "/" });

  // Crear perfil si es un usuario OAuth nuevo
  try {
    const {
      data: { user },
    } = await supabaseAdmin.auth.getUser(access_token);
    if (user) {
      const { data: existing } = await supabaseAdmin
        .from("profiles")
        .select("id")
        .eq("id", user.id)
        .maybeSingle();

      if (!existing) {
        const meta = user.user_metadata ?? {};
        const name: string =
          meta.full_name ?? meta.name ?? meta.user_name ?? user.email ?? "";
        const avatarUrl: string | null = meta.avatar_url ?? null;
        const githubHandle: string | null =
          meta.user_name ?? meta.preferred_username ?? null;
        const github = githubHandle
          ? `https://github.com/${githubHandle}`
          : null;

        await supabaseAdmin.from("profiles").insert({
          id: user.id,
          name,
          role: "Hacker",
          avatar_url: avatarUrl,
          github,
        });
      }
    }
  } catch (_) {
    // No bloqueamos el login si falla la creación de perfil
  }

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
};

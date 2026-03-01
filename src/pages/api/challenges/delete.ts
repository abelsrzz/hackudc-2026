import type { APIRoute } from "astro";
import { supabaseAdmin } from "../../../lib/supabase";

export const POST: APIRoute = async ({ request, cookies }) => {
  const access_token = cookies.get("sb-access-token")?.value;
  if (!access_token) return new Response("No autenticado", { status: 401 });

  const {
    data: { user },
  } = await supabaseAdmin.auth.getUser(access_token);
  if (!user) return new Response("No autenticado", { status: 401 });

  // Admins y Sponsors pueden borrar
  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("role, sponsor_id")
    .eq("id", user.id)
    .single();

  if (!profile || (profile.role !== "Admin" && profile.role !== "Sponsor")) {
    return new Response("No autorizado", { status: 403 });
  }

  const { challengeId } = await request.json();

  // Si es Sponsor, verificar que el challenge le pertenece
  if (profile.role === "Sponsor") {
    const { data: challenge } = await supabaseAdmin
      .from("challenges")
      .select("sponsor_id")
      .eq("id", challengeId)
      .single();

    if (!challenge || challenge.sponsor_id !== profile.sponsor_id) {
      return new Response("No autorizado para borrar este challenge", {
        status: 403,
      });
    }
  }

  const { error } = await supabaseAdmin
    .from("challenges")
    .delete()
    .eq("id", challengeId);

  if (error) return new Response(error.message, { status: 500 });

  return new Response(JSON.stringify({ success: true }));
};

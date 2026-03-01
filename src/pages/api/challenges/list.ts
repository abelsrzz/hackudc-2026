import type { APIRoute } from "astro";
import { supabase } from "../../../lib/supabase";

export const GET: APIRoute = async ({ cookies }) => {
  const access_token = cookies.get("sb-access-token")?.value;
  if (!access_token) return new Response("No autenticado", { status: 401 });

  const {
    data: { user },
  } = await supabase.auth.getUser(access_token);
  if (!user) return new Response("No autenticado", { status: 401 });

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, sponsor_id")
    .eq("id", user.id)
    .single();

  if (!profile || (profile.role !== "Sponsor" && profile.role !== "Admin")) {
    return new Response("No autorizado", { status: 403 });
  }

  let query = supabase.from("challenges").select(`
    id,
    title,
    short_description,
    reward,
    created_at,
    sponsor_id,
    created_by,
    sponsors(name),
    profiles(name)
  `);

  // Sponsor solo ve sus propios retos
  if (profile.role === "Sponsor") {
    query = query.eq("sponsor_id", profile.sponsor_id);
  }

  const { data, error } = await query;

  if (error) return new Response(error.message, { status: 500 });

  return new Response(JSON.stringify(data), { status: 200 });
};

import type { APIRoute } from "astro";
import { supabase, supabaseAdmin } from "../../../lib/supabase";

export const GET: APIRoute = async ({ cookies }) => {
  // Obtener token del usuario
  const access_token = cookies.get("sb-access-token")?.value;

  if (!access_token) {
    return new Response("No autenticado", { status: 401 });
  }

  // Obtener usuario actual
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser(access_token);
  if (userError || !user) {
    return new Response("No autenticado", { status: 401 });
  }

  // Comprobar rol en profiles
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profileError || !profile || profile.role !== "Admin") {
    return new Response("No autorizado", { status: 403 });
  }

  // Obtener lista de todos los usuarios con sus roles
  const { data: users, error: usersError } = await supabaseAdmin
    .from("profiles")
    .select("id, name, role, created_at");

  if (usersError) {
    return new Response(usersError.message, { status: 500 });
  }

  return new Response(JSON.stringify(users), { status: 200 });
};

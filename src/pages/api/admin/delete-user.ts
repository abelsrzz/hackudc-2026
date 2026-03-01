import type { APIRoute } from "astro";
import { supabaseAdmin } from "../../../lib/supabase";

export const POST: APIRoute = async ({ request, cookies }) => {
  const accessToken = cookies.get("sb-access-token");
  if (!accessToken) {
    return new Response("No autenticado", { status: 401 });
  }

  const {
    data: { user },
    error: userError,
  } = await supabaseAdmin.auth.getUser(accessToken.value);
  if (userError || !user) {
    return new Response("No autenticado", { status: 401 });
  }

  // Verificar que sea Admin
  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "Admin") {
    return new Response("No autorizado", { status: 403 });
  }

  const { userId } = await request.json();

  if (!userId) {
    return new Response("ID de usuario requerido", { status: 400 });
  }

  // No permitir que se elimine a sí mismo
  if (userId === user.id) {
    return new Response("No puedes eliminarte a ti mismo", { status: 400 });
  }

  // Eliminar usuario (esto también eliminará el perfil por CASCADE)
  const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(
    userId,
  );

  if (deleteError) {
    return new Response(JSON.stringify({ error: deleteError.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
};

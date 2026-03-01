import type { APIRoute } from "astro";
import { supabaseAdmin } from "../../../../lib/supabase";

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

  const { id } = await request.json();

  if (!id) {
    return new Response("ID de sponsor requerido", { status: 400 });
  }

  // Obtener sponsor para eliminar logo si existe
  const { data: sponsor } = await supabaseAdmin
    .from("sponsors")
    .select("logo_path")
    .eq("id", id)
    .single();

  // Eliminar logo del storage si existe
  if (sponsor?.logo_path) {
    await supabaseAdmin.storage.from("photos").remove([sponsor.logo_path]);
  }

  // Eliminar sponsor de la base de datos
  const { error: deleteError } = await supabaseAdmin
    .from("sponsors")
    .delete()
    .eq("id", id);

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

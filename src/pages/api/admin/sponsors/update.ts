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

  const { id, name, slug, website_url, description, active, logo_path } =
    await request.json();

  if (!id || !name || !slug) {
    return new Response("Faltan datos requeridos", { status: 400 });
  }

  // Preparar datos de actualización
  const updateData: any = {
    name,
    slug,
    website_url: website_url || null,
    description: description || null,
    active: active ?? true,
  };

  // Solo actualizar logo_path si se proporcionó uno nuevo
  if (logo_path !== undefined) {
    updateData.logo_path = logo_path;
  }

  const { data, error } = await supabaseAdmin
    .from("sponsors")
    .update(updateData)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify(data), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
};

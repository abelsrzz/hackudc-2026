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

  const { projectId, name, github_repo_url, description_markdown } =
    await request.json();

  if (!projectId) {
    return new Response("ID de proyecto requerido", { status: 400 });
  }

  // Verificar que el usuario es miembro del proyecto
  const { data: membership } = await supabaseAdmin
    .from("project_member")
    .select("id")
    .eq("project_id", projectId)
    .eq("member_id", user.id)
    .single();

  if (!membership) {
    return new Response("No eres miembro de este proyecto", { status: 403 });
  }

  // Actualizar solo los campos del envío, mantener el status y submitted_at
  const { data, error } = await supabaseAdmin
    .from("projects")
    .update({
      name: name || null,
      github_repo_url: github_repo_url || null,
      description_markdown: description_markdown || null,
    })
    .eq("id", projectId)
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

import type { APIRoute } from "astro";
import { supabaseAdmin } from "../../../lib/supabase";
import { canManageTasks } from "../../../lib/tasks-auth";

export const POST: APIRoute = async ({ request, cookies }) => {
  const accessToken = cookies.get("sb-access-token")?.value;
  if (!accessToken) return new Response("No autenticado", { status: 401 });

  const {
    data: { user },
    error: userError,
  } = await supabaseAdmin.auth.getUser(accessToken);
  if (userError || !user)
    return new Response("No autenticado", { status: 401 });

  const body = await request.formData();
  const title = body.get("title")?.toString().trim();
  const description = body.get("description")?.toString().trim() || null;
  const projectIdRaw = body.get("project_id")?.toString();
  const projectId = projectIdRaw ? Number(projectIdRaw) : null;

  if (!title) return new Response("Título requerido", { status: 400 });

  const allowed = await canManageTasks(user.id, projectId);
  if (!allowed) return new Response("No autorizado", { status: 403 });

  const { error } = await supabaseAdmin.from("tasks").insert({
    title,
    description,
    created_by: user.id,
    status: "pending",
    project_id: projectId,
  });

  if (error) return new Response(error.message, { status: 500 });

  const referer =
    request.headers.get("referer") || (projectId ? "/projects" : "/tasks");
  return Response.redirect(referer, 303);
};

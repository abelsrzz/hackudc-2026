import type { APIRoute } from "astro";
import { supabaseAdmin } from "../../../lib/supabase";

export const POST: APIRoute = async ({ request, cookies, redirect }) => {
  const accessToken = cookies.get("sb-access-token")?.value;
  if (!accessToken) return new Response("No autenticado", { status: 401 });

  const {
    data: { user },
    error: userError,
  } = await supabaseAdmin.auth.getUser(accessToken);
  if (userError || !user)
    return new Response("No autenticado", { status: 401 });

  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const role = profile?.role?.toLowerCase();
  if (role !== "mentor" && role !== "admin")
    return new Response("No autorizado", { status: 403 });

  const body = await request.formData();
  const taskId = body.get("task_id")?.toString();
  if (!taskId) return new Response("task_id requerido", { status: 400 });

  // Only creator or admin can delete
  const { data: task } = await supabaseAdmin
    .from("tasks")
    .select("created_by")
    .eq("id", taskId)
    .single();

  if (!task) return new Response("Tarea no encontrada", { status: 404 });
  if (task.created_by !== user.id && role !== "admin")
    return new Response(
      "Solo el creador o un admin puede eliminar esta tarea",
      { status: 403 },
    );

  const { error } = await supabaseAdmin.from("tasks").delete().eq("id", taskId);
  if (error) return new Response(error.message, { status: 500 });

  return redirect("/tasks");
};

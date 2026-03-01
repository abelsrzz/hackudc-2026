import type { APIRoute } from "astro";
import { supabaseAdmin } from "../../../../lib/supabase";

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
  const title = body.get("title")?.toString().trim();

  if (!taskId || !title) return new Response("Faltan datos", { status: 400 });

  const { error } = await supabaseAdmin
    .from("subtasks")
    .insert({ task_id: Number(taskId), title, done: false });

  if (error) return new Response(error.message, { status: 500 });

  return redirect("/tasks");
};

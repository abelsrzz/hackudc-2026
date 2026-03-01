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
  const title = body.get("title")?.toString().trim();
  const description = body.get("description")?.toString().trim() || null;
  const status = body.get("status")?.toString();

  if (!taskId) return new Response("task_id requerido", { status: 400 });

  const updates: Record<string, unknown> = { updated_at: new Date() };
  if (title) updates.title = title;
  if (description !== undefined) updates.description = description;
  if (status) updates.status = status;

  const { error } = await supabaseAdmin
    .from("tasks")
    .update(updates)
    .eq("id", taskId);

  if (error) return new Response(error.message, { status: 500 });

  return redirect("/tasks");
};

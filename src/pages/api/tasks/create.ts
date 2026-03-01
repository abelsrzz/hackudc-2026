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
  const title = body.get("title")?.toString().trim();
  const description = body.get("description")?.toString().trim() || null;

  if (!title) return new Response("Título requerido", { status: 400 });

  const { error } = await supabaseAdmin
    .from("tasks")
    .insert({ title, description, created_by: user.id, status: "pending" });

  if (error) return new Response(error.message, { status: 500 });

  return redirect("/tasks");
};

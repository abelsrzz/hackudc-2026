import type { APIRoute } from "astro";
import { supabase } from "../../../lib/supabase";

export const POST: APIRoute = async ({ request, cookies, redirect }) => {
  const access_token = cookies.get("sb-access-token")?.value;
  if (!access_token) return new Response("No autenticado", { status: 401 });

  const {
    data: { user },
  } = await supabase.auth.getUser(access_token);
  if (!user) return new Response("No autenticado", { status: 401 });

  // Obtener rol y sponsor_id del usuario
  const { data: profile } = await supabase
    .from("profiles")
    .select("role, sponsor_id")
    .eq("id", user.id)
    .single();

  if (!profile || (profile.role !== "Sponsor" && profile.role !== "Admin")) {
    return new Response("No autorizado", { status: 403 });
  }

  const formData = await request.formData();

  const title = formData.get("title")?.toString();
  const short_description = formData.get("short_description")?.toString();
  const content_markdown = formData.get("content_markdown")?.toString();
  const reward = formData.get("reward")?.toString();
  let sponsor_id = formData.get("sponsor_id")?.toString();

  // Sponsors solo pueden crear para su propia empresa
  if (profile.role === "Sponsor") {
    sponsor_id = profile.sponsor_id;
  }

  // Insertar challenge
  const { error } = await supabase.from("challenges").insert([
    {
      sponsor_id,
      created_by: user.id,
      title,
      short_description,
      content_markdown,
      reward,
    },
  ]);

  if (error) return new Response(error.message, { status: 500 });

  return redirect("/manage_challenges");
};

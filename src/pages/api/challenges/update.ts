import type { APIRoute } from "astro";
import { supabaseAdmin } from "../../../lib/supabase";

export const POST: APIRoute = async ({ request, cookies, redirect }) => {
  const access_token = cookies.get("sb-access-token")?.value;
  if (!access_token) return new Response("No autenticado", { status: 401 });

  const {
    data: { user },
  } = await supabaseAdmin.auth.getUser(access_token);
  if (!user) return new Response("No autenticado", { status: 401 });

  // Obtener rol y sponsor_id del usuario
  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("role, sponsor_id")
    .eq("id", user.id)
    .single();

  const isAdmin = profile?.role?.toLowerCase() === "admin";
  const isSponsor = !!profile?.sponsor_id;

  if (!profile || (!isAdmin && !isSponsor)) {
    return new Response("No autorizado", { status: 403 });
  }

  const formData = await request.formData();

  const challenge_id = formData.get("challenge_id")?.toString();
  const title = formData.get("title")?.toString();
  const short_description = formData.get("short_description")?.toString();
  const content_markdown = formData.get("content_markdown")?.toString();
  const reward = formData.get("reward")?.toString();

  if (!challenge_id) {
    return new Response("Challenge ID requerido", { status: 400 });
  }

  // Verificar que el challenge pertenece al sponsor del usuario (o es admin)
  const { data: existingChallenge } = await supabaseAdmin
    .from("challenges")
    .select("sponsor_id")
    .eq("id", challenge_id)
    .single();

  if (!existingChallenge) {
    return new Response("Challenge no encontrado", { status: 404 });
  }

  if (!isAdmin && existingChallenge.sponsor_id !== profile.sponsor_id) {
    return new Response("No autorizado para editar este challenge", {
      status: 403,
    });
  }

  // Actualizar challenge
  const { error } = await supabaseAdmin
    .from("challenges")
    .update({
      title,
      short_description,
      content_markdown,
      reward,
    })
    .eq("id", challenge_id);

  if (error) return new Response(error.message, { status: 500 });

  return redirect(`/challenge?id=${challenge_id}`);
};

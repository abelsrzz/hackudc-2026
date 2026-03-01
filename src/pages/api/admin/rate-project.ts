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

  // Verificar que sea Admin
  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "Admin") {
    return new Response("No autorizado", { status: 403 });
  }

  const { projectId, score } = await request.json();

  if (!projectId || score === undefined || score === null) {
    return new Response("Datos incompletos", { status: 400 });
  }

  // Validar rango de puntuación
  const numScore = parseFloat(score);
  if (isNaN(numScore) || numScore < 0 || numScore > 10) {
    return new Response("Puntuación debe estar entre 0 y 10", { status: 400 });
  }

  // Insertar o actualizar puntuación
  const { data, error } = await supabaseAdmin
    .from("project_ratings")
    .upsert(
      {
        project_id: projectId,
        admin_id: user.id,
        score: numScore,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: "project_id,admin_id",
      },
    )
    .select()
    .single();

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Obtener nota media actualizada
  const { data: avgData } = await supabaseAdmin
    .from("project_average_ratings")
    .select("average_score, rating_count")
    .eq("project_id", projectId)
    .single();

  return new Response(
    JSON.stringify({
      rating: data,
      average: avgData?.average_score || numScore,
      count: avgData?.rating_count || 1,
    }),
    {
      status: 200,
      headers: { "Content-Type": "application/json" },
    },
  );
};

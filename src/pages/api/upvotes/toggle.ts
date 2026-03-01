import type { APIRoute } from "astro";
import { supabaseAdmin } from "../../../lib/supabase";

export const POST: APIRoute = async ({ request, cookies }) => {
  const json = (data: object, status = 200) =>
    new Response(JSON.stringify(data), {
      status,
      headers: { "Content-Type": "application/json" },
    });

  const accessToken = cookies.get("sb-access-token");
  if (!accessToken) return json({ error: "No autenticado" }, 401);

  const {
    data: { user },
    error: userError,
  } = await supabaseAdmin.auth.getUser(accessToken.value);
  if (userError || !user) return json({ error: "No autenticado" }, 401);

  let body: { entity_type?: string; entity_id?: string };
  try {
    body = await request.json();
  } catch {
    return json({ error: "JSON inválido" }, 400);
  }

  const { entity_type, entity_id } = body;

  if (!entity_type || !entity_id) {
    return json({ error: "entity_type y entity_id son requeridos" }, 400);
  }

  // Comprobar si ya votó
  const { data: existing } = await supabaseAdmin
    .from("upvotes")
    .select("id")
    .eq("user_id", user.id)
    .eq("entity_type", entity_type)
    .eq("entity_id", entity_id)
    .maybeSingle();

  if (existing) {
    // Quitar voto
    await supabaseAdmin.from("upvotes").delete().eq("id", existing.id);
  } else {
    // Añadir voto
    await supabaseAdmin.from("upvotes").insert({
      user_id: user.id,
      entity_type,
      entity_id,
    });
  }

  // Contar votos actuales
  const { count } = await supabaseAdmin
    .from("upvotes")
    .select("id", { count: "exact", head: true })
    .eq("entity_type", entity_type)
    .eq("entity_id", entity_id);

  return json({ count: count ?? 0, voted: !existing });
};

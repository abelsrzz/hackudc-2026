import type { APIRoute } from "astro";
import { supabaseAdmin } from "../../../lib/supabase";

export const POST: APIRoute = async ({ request, cookies }) => {
  const accessToken = cookies.get("sb-access-token")?.value;
  if (!accessToken) return new Response("No autenticado", { status: 401 });

  const {
    data: { user },
    error: userError,
  } = await supabaseAdmin.auth.getUser(accessToken);
  if (userError || !user)
    return new Response("No autenticado", { status: 401 });

  const { messageId, newContent } = await request.json();
  if (!messageId || !newContent)
    return new Response("Faltan datos", { status: 400 });

  // Solo el usuario creador puede editar su mensaje
  const { data: message } = await supabaseAdmin
    .from("messages")
    .select("user_id")
    .eq("id", messageId)
    .single();

  if (!message || message.user_id !== user.id) {
    return new Response("No autorizado", { status: 403 });
  }

  const { error } = await supabaseAdmin
    .from("messages")
    .update({ content: newContent, edited_at: new Date() })
    .eq("id", messageId);

  if (error) return new Response(error.message, { status: 500 });
  return new Response(JSON.stringify({ success: true }));
};

import type { APIRoute } from "astro";
import { supabaseAdmin } from "../../../lib/supabase";

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    const accessToken = cookies.get("sb-access-token")?.value;
    if (!accessToken) {
      return new Response("No autenticado", { status: 401 });
    }

    const {
      data: { user },
      error: userError,
    } = await supabaseAdmin.auth.getUser(accessToken);
    if (userError || !user) {
      return new Response("No autenticado", { status: 401 });
    }

    const { messageId } = await request.json();
    if (!messageId) {
      return new Response("Falta el ID del mensaje", { status: 400 });
    }

    // Obtener el mensaje y el perfil del usuario
    const [{ data: message }, { data: profile }] = await Promise.all([
      supabaseAdmin
        .from("messages")
        .select("id, user_id, attachment_path")
        .eq("id", messageId)
        .single(),
      supabaseAdmin
        .from("profiles")
        .select("name, role")
        .eq("id", user.id)
        .single(),
    ]);

    if (!message) {
      return new Response("Mensaje no encontrado", { status: 404 });
    }

    const role = profile?.role?.toLowerCase();
    const isModerator = role === "admin" || role === "mentor";
    const isOwner = message.user_id === user.id;

    if (!isModerator && !isOwner) {
      return new Response("Sin permisos", { status: 403 });
    }

    if (isModerator) {
      // Admin/mentor: borrar completamente
      // Primero eliminar foto del storage si existe
      if (message.attachment_path) {
        await supabaseAdmin.storage
          .from("photos")
          .remove([message.attachment_path]);
      }

      const { error } = await supabaseAdmin
        .from("messages")
        .delete()
        .eq("id", messageId);

      if (error) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
          headers: { "Content-Type": "application/json" },
        });
      }
    } else {
      // Propietario: soft delete — marcar el contenido y eliminar foto
      if (message.attachment_path) {
        await supabaseAdmin.storage
          .from("photos")
          .remove([message.attachment_path]);
      }

      const deletedContent = `__DELETED__:${profile?.name || "Usuario"}`;
      const { error } = await supabaseAdmin
        .from("messages")
        .update({
          content: deletedContent,
          edited_at: null,
          attachment_path: null,
        })
        .eq("id", messageId);

      if (error) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
          headers: { "Content-Type": "application/json" },
        });
      }
    }

    return new Response(JSON.stringify({ success: true, isModerator }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({
        error: "Error interno del servidor",
        details: String(err),
      }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
};

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

    const body = await request.json();
    const { content, channel, reply_to } = body;

    if (!content || !channel) {
      return new Response("Faltan datos", { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from("messages")
      .insert([
        {
          user_id: user.id,
          content,
          channel,
          reply_to: reply_to || null,
        },
      ])
      .select();

    if (error) {
      return new Response(
        JSON.stringify({ error: error.message, details: error }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    return new Response(JSON.stringify({ success: true, data }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({
        error: "Error interno del servidor",
        details: String(err),
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
};

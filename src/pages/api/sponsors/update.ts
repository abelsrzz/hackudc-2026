import type { APIRoute } from "astro";
import { supabaseAdmin } from "../../../lib/supabase";

export const POST: APIRoute = async ({ request, cookies }) => {
  const accessToken = cookies.get("sb-access-token");
  if (!accessToken) {
    return new Response(JSON.stringify({ error: "No autenticado" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const {
    data: { user },
    error: userError,
  } = await supabaseAdmin.auth.getUser(accessToken.value);

  if (userError || !user) {
    return new Response(JSON.stringify({ error: "No autenticado" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Verificar que el usuario es Sponsor
  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("role, sponsor_id")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "Sponsor" || !profile.sponsor_id) {
    return new Response(
      JSON.stringify({ error: "No tienes permisos de sponsor" }),
      {
        status: 403,
        headers: { "Content-Type": "application/json" },
      },
    );
  }

  const formData = await request.formData();
  const name = formData.get("name")?.toString()?.trim();
  const website_url = formData.get("website_url")?.toString()?.trim();
  const description = formData.get("description")?.toString()?.trim();

  const updates: any = {};
  if (name) updates.name = name;
  if (website_url) updates.website_url = website_url;
  if (description) updates.description = description;

  if (Object.keys(updates).length === 0) {
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { error: updateError } = await supabaseAdmin
    .from("sponsors")
    .update(updates)
    .eq("id", profile.sponsor_id);

  if (updateError) {
    return new Response(JSON.stringify({ error: updateError.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
};

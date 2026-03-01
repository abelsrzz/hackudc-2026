import type { APIRoute } from "astro";
import { supabaseAdmin } from "../../../lib/supabase";

const ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/svg+xml",
];
const MAX_SIZE_MB = 5;

export const POST: APIRoute = async ({ request, cookies, redirect }) => {
  const accessToken = cookies.get("sb-access-token");
  if (!accessToken) return redirect("/signin");

  const {
    data: { user },
    error: userError,
  } = await supabaseAdmin.auth.getUser(accessToken.value);
  if (userError || !user) return redirect("/signin");

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
  const file = formData.get("logo") as File | null;

  if (!file || file.size === 0) {
    return new Response(
      JSON.stringify({ error: "No se ha seleccionado ningún logo" }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      },
    );
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return new Response(
      JSON.stringify({
        error: "Formato no permitido. Usa JPG, PNG, WebP o SVG",
      }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      },
    );
  }

  if (file.size > MAX_SIZE_MB * 1024 * 1024) {
    return new Response(
      JSON.stringify({ error: `El logo no puede superar ${MAX_SIZE_MB} MB` }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      },
    );
  }

  const ext = file.name.split(".").pop()?.toLowerCase() ?? "png";
  const storagePath = `${profile.sponsor_id}/${Date.now()}.${ext}`;

  const arrayBuffer = await file.arrayBuffer();

  const { error: uploadError } = await supabaseAdmin.storage
    .from("sponsor-logos")
    .upload(storagePath, new Uint8Array(arrayBuffer), {
      contentType: file.type,
      upsert: false,
    });

  if (uploadError) {
    return new Response(JSON.stringify({ error: uploadError.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Actualizar el logo_path del sponsor
  const { error: updateError } = await supabaseAdmin
    .from("sponsors")
    .update({ logo_path: storagePath })
    .eq("id", profile.sponsor_id);

  if (updateError) {
    // Intentar limpiar el archivo subido
    await supabaseAdmin.storage.from("sponsor-logos").remove([storagePath]);
    return new Response(JSON.stringify({ error: updateError.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ success: true, path: storagePath }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
};

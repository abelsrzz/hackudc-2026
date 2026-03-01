import type { APIRoute } from "astro";
import { supabaseAdmin } from "../../../../lib/supabase";

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

  const formData = await request.formData();
  const file = formData.get("file") as File;

  if (!file) {
    return new Response("No se proporcionó archivo", { status: 400 });
  }

  // Validar tipo de archivo
  const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
  if (!validTypes.includes(file.type)) {
    return new Response("Tipo de archivo no válido. Solo: jpg, png, webp", {
      status: 400,
    });
  }

  // Validar tamaño (máximo 5MB)
  if (file.size > 5 * 1024 * 1024) {
    return new Response("El archivo es demasiado grande (máximo 5MB)", {
      status: 400,
    });
  }

  const arrayBuffer = await file.arrayBuffer();
  const buffer = new Uint8Array(arrayBuffer);

  const ext = file.type.split("/")[1];
  const timestamp = Date.now();
  const path = `sponsor-logos/${timestamp}.${ext}`;

  const { error: uploadError } = await supabaseAdmin.storage
    .from("photos")
    .upload(path, buffer, {
      contentType: file.type,
      upsert: false,
    });

  if (uploadError) {
    return new Response(JSON.stringify({ error: uploadError.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ path }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
};

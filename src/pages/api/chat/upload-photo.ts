import type { APIRoute } from "astro";
import { supabaseAdmin } from "../../../lib/supabase";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_SIZE_MB = 8;

export const POST: APIRoute = async ({ request, cookies }) => {
  const accessToken = cookies.get("sb-access-token");
  if (!accessToken) {
    return new Response(JSON.stringify({ error: "No autenticado" }), {
      status: 401,
    });
  }

  const {
    data: { user },
    error: userError,
  } = await supabaseAdmin.auth.getUser(accessToken.value);
  if (userError || !user) {
    return new Response(JSON.stringify({ error: "Usuario inválido" }), {
      status: 401,
    });
  }

  const formData = await request.formData();
  const file = formData.get("photo") as File | null;

  if (!file || file.size === 0) {
    return new Response(
      JSON.stringify({ error: "No se ha seleccionado ninguna imagen" }),
      { status: 400 },
    );
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return new Response(
      JSON.stringify({
        error: "Formato no permitido. Usa JPG, PNG, WebP o GIF",
      }),
      { status: 400 },
    );
  }

  if (file.size > MAX_SIZE_MB * 1024 * 1024) {
    return new Response(
      JSON.stringify({
        error: `La imagen no puede superar ${MAX_SIZE_MB} MB`,
      }),
      { status: 400 },
    );
  }

  const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
  const storagePath = `chat/${user.id}/${Date.now()}.${ext}`;

  const arrayBuffer = await file.arrayBuffer();

  const { error: uploadError } = await supabaseAdmin.storage
    .from("photos")
    .upload(storagePath, new Uint8Array(arrayBuffer), {
      contentType: file.type,
      upsert: false,
    });

  if (uploadError) {
    return new Response(JSON.stringify({ error: uploadError.message }), {
      status: 500,
    });
  }

  return new Response(JSON.stringify({ path: storagePath }), { status: 200 });
};

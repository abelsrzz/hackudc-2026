import type { APIRoute } from "astro";
import { supabaseAdmin } from "../../../lib/supabase";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_SIZE_MB = 8;

export const POST: APIRoute = async ({ request, cookies, redirect }) => {
  const accessToken = cookies.get("sb-access-token");
  if (!accessToken) return redirect("/signin");

  const {
    data: { user },
    error: userError,
  } = await supabaseAdmin.auth.getUser(accessToken.value);
  if (userError || !user) return redirect("/signin");

  const formData = await request.formData();
  const file = formData.get("photo") as File | null;
  const caption = formData.get("caption")?.toString()?.trim() ?? null;

  if (!file || file.size === 0) {
    return redirect(
      `/photos?error=${encodeURIComponent("No se ha seleccionado ninguna imagen")}`,
    );
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return redirect(
      `/photos?error=${encodeURIComponent("Formato no permitido. Usa JPG, PNG, WebP o GIF")}`,
    );
  }

  if (file.size > MAX_SIZE_MB * 1024 * 1024) {
    return redirect(
      `/photos?error=${encodeURIComponent(`La imagen no puede superar ${MAX_SIZE_MB} MB`)}`,
    );
  }

  const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
  const storagePath = `${user.id}/${Date.now()}.${ext}`;

  const arrayBuffer = await file.arrayBuffer();

  const { error: uploadError } = await supabaseAdmin.storage
    .from("photos")
    .upload(storagePath, new Uint8Array(arrayBuffer), {
      contentType: file.type,
      upsert: false,
    });

  if (uploadError) {
    return redirect(`/photos?error=${encodeURIComponent(uploadError.message)}`);
  }

  const { error: dbError } = await supabaseAdmin.from("photos").insert({
    user_id: user.id,
    storage_path: storagePath,
    caption: caption || null,
  });

  if (dbError) {
    // Intentar limpiar el archivo subido
    await supabaseAdmin.storage.from("photos").remove([storagePath]);
    return redirect(`/photos?error=${encodeURIComponent(dbError.message)}`);
  }

  return redirect("/photos");
};

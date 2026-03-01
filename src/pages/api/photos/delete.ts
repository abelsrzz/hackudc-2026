import type { APIRoute } from "astro";
import { supabaseAdmin } from "../../../lib/supabase";

export const POST: APIRoute = async ({ request, cookies, redirect }) => {
  const accessToken = cookies.get("sb-access-token");
  if (!accessToken) return redirect("/signin");

  const {
    data: { user },
    error: userError,
  } = await supabaseAdmin.auth.getUser(accessToken.value);
  if (userError || !user) return redirect("/signin");

  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const role = profile?.role?.toLowerCase();

  const formData = await request.formData();
  const photoId = formData.get("photo_id")?.toString();

  if (!photoId) {
    return redirect(
      `/photos?error=${encodeURIComponent("ID de foto no especificado")}`,
    );
  }

  // Obtener la foto para verificar permisos y obtener la ruta
  const { data: photo } = await supabaseAdmin
    .from("photos")
    .select("id, user_id, storage_path")
    .eq("id", photoId)
    .single();

  if (!photo) {
    return redirect(
      `/photos?error=${encodeURIComponent("Foto no encontrada")}`,
    );
  }

  const isOwner = photo.user_id === user.id;
  const isModerator = role === "admin" || role === "mentor";

  if (!isOwner && !isModerator) {
    return redirect(
      `/photos?error=${encodeURIComponent("No tienes permiso para eliminar esta foto")}`,
    );
  }

  // Eliminar de storage primero
  const { error: storageError } = await supabaseAdmin.storage
    .from("photos")
    .remove([photo.storage_path]);

  if (storageError) {
    return redirect(
      `/photos?error=${encodeURIComponent(storageError.message)}`,
    );
  }

  // Eliminar de la BD
  const { error: dbError } = await supabaseAdmin
    .from("photos")
    .delete()
    .eq("id", photoId);

  if (dbError) {
    return redirect(`/photos?error=${encodeURIComponent(dbError.message)}`);
  }

  return redirect("/photos");
};

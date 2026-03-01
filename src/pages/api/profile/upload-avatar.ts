import type { APIRoute } from "astro";
import { supabaseAdmin } from "../../../lib/supabase";

export const POST: APIRoute = async ({ request, cookies }) => {
  const referer = request.headers.get("referer") ?? "/profile";

  const accessToken = cookies.get("sb-access-token");
  if (!accessToken) return Response.redirect("/signin", 303);

  const {
    data: { user },
    error,
  } = await supabaseAdmin.auth.getUser(accessToken.value);
  if (error || !user) return Response.redirect("/signin", 303);

  const form = await request.formData();
  const file = form.get("avatar") as File | null;

  if (!file || file.size === 0) {
    return Response.redirect(`${referer}?error=no_file`, 303);
  }

  // Max 2 MB
  if (file.size > 2 * 1024 * 1024) {
    return Response.redirect(`${referer}?error=file_too_large`, 303);
  }

  const allowed = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
  if (!allowed.includes(file.type)) {
    return Response.redirect(`${referer}?error=invalid_type`, 303);
  }

  const buffer = await file.arrayBuffer();

  // Ensure the bucket exists (creates it on first run)
  const { data: buckets } = await supabaseAdmin.storage.listBuckets();
  const bucketExists = buckets?.some((b) => b.name === "avatars");
  if (!bucketExists) {
    await supabaseAdmin.storage.createBucket("avatars", { public: true });
  }

  // Store as {userId} (no extension) — always overwrites the same key
  const filePath = user.id;

  const { error: uploadError } = await supabaseAdmin.storage
    .from("avatars")
    .upload(filePath, buffer, {
      contentType: file.type,
      upsert: true,
      cacheControl: "0",
    });

  if (uploadError) {
    console.error("Avatar upload error:", uploadError.message);
    return Response.redirect(`${referer}?error=upload_failed`, 303);
  }

  const {
    data: { publicUrl },
  } = supabaseAdmin.storage.from("avatars").getPublicUrl(filePath);

  // Append cache-bust timestamp so the browser always fetches the new image
  const avatarUrl = `${publicUrl}?t=${Date.now()}`;

  await supabaseAdmin
    .from("profiles")
    .update({ avatar_url: avatarUrl })
    .eq("id", user.id);

  return Response.redirect(`${referer}?success=avatar`, 303);
};

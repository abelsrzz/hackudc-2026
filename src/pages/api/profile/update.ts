import type { APIRoute } from "astro";
import { supabaseAdmin } from "../../../lib/supabase";

export const POST: APIRoute = async ({ request, cookies, redirect }) => {
  const accessToken = cookies.get("sb-access-token");
  if (!accessToken) return redirect("/signin");

  const {
    data: { user },
    error,
  } = await supabaseAdmin.auth.getUser(accessToken.value);
  if (error || !user) return redirect("/signin");

  const form = await request.formData();

  const fields: Record<string, string | null> = {
    name: (form.get("name") as string)?.trim() || null,
    linkedin: (form.get("linkedin") as string)?.trim() || null,
    github: (form.get("github") as string)?.trim() || null,
    twitter: (form.get("twitter") as string)?.trim() || null,
    instagram: (form.get("instagram") as string)?.trim() || null,
    website: (form.get("website") as string)?.trim() || null,
    institution: (form.get("institution") as string)?.trim() || null,
    degree: (form.get("degree") as string)?.trim() || null,
    year_of_study: (form.get("year_of_study") as string)?.trim() || null,
  };

  const { error: updateError } = await supabaseAdmin
    .from("profiles")
    .update(fields)
    .eq("id", user.id);

  if (updateError) {
    return redirect("/profile?error=update_failed");
  }

  return redirect("/profile?success=1");
};

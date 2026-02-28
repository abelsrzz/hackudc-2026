import type { APIRoute } from "astro";
import { supabaseAdmin } from "../../../lib/supabase";

export const POST: APIRoute = async ({ request, cookies, redirect }) => {
  const accessToken = cookies.get("sb-access-token")?.value;
  if (!accessToken) return redirect("/signin");

  const {
    data: { user },
    error: userError,
  } = await supabaseAdmin.auth.getUser(accessToken);
  if (userError || !user) return redirect("/signin");

  const formData = await request.formData();
  const projectId = formData.get("project_id")?.toString();
  const sede = formData.get("sede")?.toString().trim() || null;

  if (!projectId) {
    return redirect("/projects?error=Falta+el+ID+del+proyecto");
  }

  // Verificar que el usuario pertenece al proyecto
  const { data: membership } = await supabaseAdmin
    .from("project_member")
    .select("id")
    .eq("member_id", user.id)
    .eq("project_id", projectId)
    .maybeSingle();

  if (!membership) {
    return redirect("/projects?error=No+perteneces+a+este+proyecto");
  }

  const { error: updateError } = await supabaseAdmin
    .from("projects")
    .update({ sede })
    .eq("id", projectId);

  if (updateError) {
    return redirect(
      `/projects?error=${encodeURIComponent("Error al actualizar la sede: " + updateError.message)}`,
    );
  }

  return redirect("/projects");
};

import type { APIRoute } from "astro";
import { supabaseAdmin } from "../../../lib/supabase";

export const POST: APIRoute = async ({ request, cookies, redirect }) => {
  // Auth
  const accessToken = cookies.get("sb-access-token")?.value;

  if (!accessToken) {
    return redirect("/signin");
  }

  const {
    data: { user },
    error: userError,
  } = await supabaseAdmin.auth.getUser(accessToken);

  if (userError || !user) {
    return redirect("/signin");
  }

  const formData = await request.formData();
  const projectId = formData.get("project_id")?.toString();

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

  // Eliminar la membresía
  const { error: deleteError } = await supabaseAdmin
    .from("project_member")
    .delete()
    .eq("id", membership.id);

  if (deleteError) {
    return redirect(
      `/projects?error=${encodeURIComponent("Error al abandonar el proyecto: " + deleteError.message)}`,
    );
  }

  return redirect("/projects?success=Has+abandonado+el+proyecto");
};

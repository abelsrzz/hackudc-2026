import type { APIRoute } from "astro";
import { supabaseAdmin } from "../../../lib/supabase";

export const POST: APIRoute = async ({ request, cookies, redirect }) => {
  // Auth
  const accessToken = cookies.get("sb-access-token")?.value;
  const refreshToken = cookies.get("sb-refresh-token")?.value;

  if (!accessToken || !refreshToken) {
    return redirect("/signin");
  }

  // Verificar el token con el cliente admin para evitar el singleton compartido
  const {
    data: { user },
    error: userError,
  } = await supabaseAdmin.auth.getUser(accessToken);

  if (userError || !user) {
    return redirect("/signin");
  }

  // Verificar que el usuario sea Hacker
  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role?.toLowerCase() !== "hacker") {
    return redirect("/projects?error=Solo+los+hackers+pueden+crear+proyectos");
  }

  // Verificar que el usuario no esté ya en un proyecto
  const { data: existing } = await supabaseAdmin
    .from("project_member")
    .select("id")
    .eq("member_id", user.id)
    .maybeSingle();

  if (existing) {
    return redirect("/projects?error=Ya+formas+parte+de+un+proyecto");
  }

  const formData = await request.formData();
  const name = formData.get("name")?.toString().trim();

  if (!name) {
    return redirect("/projects?error=El+nombre+del+proyecto+es+obligatorio");
  }

  // Crear el proyecto
  const { data: project, error: projectError } = await supabaseAdmin
    .from("projects")
    .insert({ name })
    .select("id")
    .single();

  if (projectError || !project) {
    return redirect(
      `/projects?error=${encodeURIComponent("Error al crear el proyecto: " + projectError?.message)}`,
    );
  }

  // Añadir al creador como miembro
  const { error: memberError } = await supabaseAdmin
    .from("project_member")
    .insert({ member_id: user.id, project_id: project.id });

  if (memberError) {
    return redirect(
      `/projects?error=${encodeURIComponent("Error al unirse al proyecto: " + memberError.message)}`,
    );
  }

  return redirect("/projects");
};

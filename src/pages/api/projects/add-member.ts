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
  const memberEmail = formData.get("member_email")?.toString().trim();
  const projectId = formData.get("project_id")?.toString();

  if (!memberEmail || !projectId) {
    return redirect("/projects?error=Faltan+datos+obligatorios");
  }

  // Verificar que el usuario que hace la petición pertenece al proyecto
  const { data: requesterMembership } = await supabaseAdmin
    .from("project_member")
    .select("id")
    .eq("member_id", user.id)
    .eq("project_id", projectId)
    .maybeSingle();

  if (!requesterMembership) {
    return redirect("/projects?error=No+perteneces+a+este+proyecto");
  }

  // Verificar que el proyecto no tenga ya 4 miembros
  const { data: members } = await supabaseAdmin
    .from("project_member")
    .select("id")
    .eq("project_id", projectId);

  if (members && members.length >= 4) {
    return redirect(
      "/projects?error=El+proyecto+ya+tiene+el+maximo+de+4+miembros",
    );
  }

  // Buscar el usuario por email usando el admin client
  const {
    data: { users },
    error: listError,
  } = await supabaseAdmin.auth.admin.listUsers({
    perPage: 1000,
  });

  if (listError) {
    return redirect("/projects?error=Error+al+buscar+el+usuario");
  }

  const targetAuthUser = users.find((u) => u.email === memberEmail);

  if (!targetAuthUser) {
    return redirect("/projects?error=No+existe+ningun+usuario+con+ese+correo");
  }

  // Verificar que el usuario objetivo es Hacker
  const { data: targetProfile } = await supabaseAdmin
    .from("profiles")
    .select("role")
    .eq("id", targetAuthUser.id)
    .maybeSingle();

  if (!targetProfile || targetProfile.role?.toLowerCase() !== "hacker") {
    return redirect("/projects?error=El+usuario+debe+tener+rol+de+Hacker");
  }

  // Verificar que el usuario objetivo no esté ya en un proyecto
  const { data: targetExisting } = await supabaseAdmin
    .from("project_member")
    .select("id")
    .eq("member_id", targetAuthUser.id)
    .maybeSingle();

  if (targetExisting) {
    return redirect("/projects?error=Ese+usuario+ya+pertenece+a+un+proyecto");
  }

  // Añadir miembro
  const { error: insertError } = await supabaseAdmin
    .from("project_member")
    .insert({ member_id: targetAuthUser.id, project_id: parseInt(projectId) });

  if (insertError) {
    return redirect(
      `/projects?error=${encodeURIComponent("Error al añadir el miembro: " + insertError.message)}`,
    );
  }

  return redirect("/projects");
};

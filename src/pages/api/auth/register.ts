import type { APIRoute } from "astro";
import { supabase, supabaseAdmin } from "../../../lib/supabase";

export const POST: APIRoute = async ({ request, redirect }) => {
  const formData = await request.formData();
  const email = formData.get("email")?.toString();
  const password = formData.get("password")?.toString();
  const name = formData.get("name")?.toString() || "";
  const institution = formData.get("institution")?.toString() || null;
  const degree = formData.get("degree")?.toString() || null;
  const year_of_study = formData.get("year_of_study")?.toString() || null;
  const githubHandle = formData.get("github")?.toString().trim() || null;
  const github = githubHandle
    ? githubHandle.startsWith("http")
      ? githubHandle
      : `https://github.com/${githubHandle}`
    : null;

  if (!email || !password) {
    return new Response("Correo electrónico y contraseña obligatorios", {
      status: 400,
    });
  }

  // Crear usuario en Supabase Auth
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
  });

  if (authError || !authData.user) {
    return new Response(authError?.message || "Error al crear usuario", {
      status: 500,
    });
  }

  // Crear perfil en tabla 'profiles' con rol fijo 'Hacker'
  const { error: profileError } = await supabase.from("profiles").insert([
    {
      id: authData.user.id,
      name,
      role: "Hacker",
      institution: institution || undefined,
      degree: degree || undefined,
      year_of_study: year_of_study || undefined,
      github: github || undefined,
    },
  ]);

  if (profileError) {
    // Rollback: eliminar usuario de Auth si falla la creación del perfil
    await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
    return new Response(`Error al crear perfil: ${profileError.message}`, {
      status: 500,
    });
  }

  return redirect("/signin");
};

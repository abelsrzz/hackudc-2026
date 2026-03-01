import type { APIRoute } from "astro";
import { supabaseAdmin } from "../../../lib/supabase";

export const POST: APIRoute = async ({ request, cookies }) => {
  const accessToken = cookies.get("sb-access-token");
  if (!accessToken) {
    return new Response("No autenticado", { status: 401 });
  }

  const {
    data: { user },
    error: userError,
  } = await supabaseAdmin.auth.getUser(accessToken.value);
  if (userError || !user) {
    return new Response("No autenticado", { status: 401 });
  }

  // Verificar que sea Admin
  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "Admin") {
    return new Response("No autorizado", { status: 403 });
  }

  const { email, password, name, role, sponsor_id } = await request.json();

  if (!email || !password) {
    return new Response("Email y contraseña son requeridos", { status: 400 });
  }

  // Crear usuario en auth.users
  const { data: newUser, error: createError } =
    await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

  if (createError) {
    return new Response(JSON.stringify({ error: createError.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Crear/actualizar perfil con los datos proporcionados
  const { error: profileError } = await supabaseAdmin.from("profiles").upsert({
    id: newUser.user!.id,
    name: name || email.split("@")[0],
    role: role || "Hacker",
    sponsor_id: sponsor_id || null,
  });

  if (profileError) {
    return new Response(JSON.stringify({ error: profileError.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify(newUser.user), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
};

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

  // Solo mentores (o admins) pueden responder
  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const role = profile?.role?.toLowerCase();
  if (role !== "mentor" && role !== "admin") {
    return redirect("/dashboard");
  }

  const formData = await request.formData();
  const requestId = formData.get("request_id")?.toString();
  const response = formData.get("response")?.toString()?.trim();

  if (!requestId || !response) {
    return redirect(
      `/needhelp?error=${encodeURIComponent("Datos incompletos")}`,
    );
  }

  // Verificar que el mentor está asignado a esta solicitud
  const { data: ar } = await supabaseAdmin
    .from("assistance_requests")
    .select("id, assigned_mentor, status")
    .eq("id", requestId)
    .single();

  if (!ar || ar.assigned_mentor !== user.id || ar.status !== "assigned") {
    return redirect(
      `/needhelp?error=${encodeURIComponent("No tienes permiso para responder esta solicitud")}`,
    );
  }

  const { error } = await supabaseAdmin
    .from("assistance_requests")
    .update({ mentor_response: response })
    .eq("id", requestId);

  if (error) {
    return redirect(`/needhelp?error=${encodeURIComponent(error.message)}`);
  }

  return redirect("/needhelp");
};

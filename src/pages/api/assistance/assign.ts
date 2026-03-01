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

  // Solo mentores y sponsors
  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("role, sponsor_id")
    .eq("id", user.id)
    .single();

  const canManage =
    profile?.role?.toLowerCase() === "mentor" ||
    profile?.role?.toLowerCase() === "admin" ||
    !!profile?.sponsor_id;

  if (!profile || !canManage) {
    return redirect(
      "/needhelp?error=Solo+mentores+y+sponsors+pueden+asignarse+solicitudes",
    );
  }

  const formData = await request.formData();
  const requestId = formData.get("request_id")?.toString();

  if (!requestId) {
    return redirect("/needhelp?error=Falta+el+ID+de+la+solicitud");
  }

  // Verificar que la solicitud está en pending
  const { data: ar } = await supabaseAdmin
    .from("assistance_requests")
    .select("id, status")
    .eq("id", requestId)
    .maybeSingle();

  if (!ar) {
    return redirect("/needhelp?error=Solicitud+no+encontrada");
  }
  if (ar.status !== "pending") {
    return redirect("/needhelp?error=La+solicitud+ya+no+está+disponible");
  }

  const { error } = await supabaseAdmin
    .from("assistance_requests")
    .update({ status: "assigned", assigned_mentor: user.id })
    .eq("id", requestId);

  if (error) {
    return redirect(
      `/needhelp?error=${encodeURIComponent("Error al asignarse: " + error.message)}`,
    );
  }

  return redirect("/needhelp");
};

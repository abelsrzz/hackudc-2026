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
  const requestId = formData.get("request_id")?.toString();
  const newStatus = formData.get("status")?.toString(); // cancel | done | unassign
  const origin = formData.get("origin")?.toString() ?? "projects"; // projects | needhelp

  const redirectBase = origin === "needhelp" ? "/needhelp" : "/projects";

  if (!requestId || !newStatus) {
    return redirect(`${redirectBase}?error=Faltan+datos+obligatorios`);
  }

  // Obtener la solicitud actual
  const { data: ar } = await supabaseAdmin
    .from("assistance_requests")
    .select("id, status, project_id, assigned_mentor")
    .eq("id", requestId)
    .maybeSingle();

  if (!ar) {
    return redirect(`${redirectBase}?error=Solicitud+no+encontrada`);
  }

  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("role, sponsor_id")
    .eq("id", user.id)
    .single();

  const role = profile?.role?.toLowerCase();
  const canManage =
    role === "mentor" || role === "admin" || !!profile?.sponsor_id;

  // ── Mentor / Admin / Sponsor: unassign o done ──
  if (canManage) {
    if (ar.assigned_mentor !== user.id) {
      return redirect(`${redirectBase}?error=No+eres+el+mentor+asignado`);
    }
    if (newStatus === "unassign") {
      const { error } = await supabaseAdmin
        .from("assistance_requests")
        .update({ status: "pending", assigned_mentor: null })
        .eq("id", requestId);
      if (error)
        return redirect(
          `${redirectBase}?error=${encodeURIComponent(error.message)}`,
        );
      return redirect(redirectBase);
    }
    if (newStatus === "done") {
      const { error } = await supabaseAdmin
        .from("assistance_requests")
        .update({ status: "done" })
        .eq("id", requestId);
      if (error)
        return redirect(
          `${redirectBase}?error=${encodeURIComponent(error.message)}`,
        );
      return redirect(redirectBase);
    }
    return redirect(`${redirectBase}?error=Acción+no+permitida`);
  }

  // ── Hacker: cancel o done ──
  if (role === "hacker") {
    // Verificar que pertenece al proyecto de la solicitud
    const { data: membership } = await supabaseAdmin
      .from("project_member")
      .select("id")
      .eq("member_id", user.id)
      .eq("project_id", ar.project_id)
      .maybeSingle();

    if (!membership) {
      return redirect(`${redirectBase}?error=No+perteneces+a+este+proyecto`);
    }

    if (newStatus === "cancel" || newStatus === "done") {
      const { error } = await supabaseAdmin
        .from("assistance_requests")
        .update({ status: newStatus })
        .eq("id", requestId);
      if (error)
        return redirect(
          `${redirectBase}?error=${encodeURIComponent(error.message)}`,
        );
      return redirect(redirectBase);
    }
    return redirect(`${redirectBase}?error=Acción+no+permitida`);
  }

  return redirect(`${redirectBase}?error=Rol+no+autorizado`);
};

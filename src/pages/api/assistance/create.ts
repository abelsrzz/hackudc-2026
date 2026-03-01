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

  // Solo hackers con proyecto
  const { data: membership } = await supabaseAdmin
    .from("project_member")
    .select("project_id")
    .eq("member_id", user.id)
    .maybeSingle();

  const formData = await request.formData();
  const origin = formData.get("origin")?.toString() ?? "projects";
  const redirectBase = origin === "needhelp" ? "/needhelp" : "/projects";

  if (!membership) {
    return redirect(
      `${redirectBase}?error=Debes+pertenecer+a+un+proyecto+para+solicitar+ayuda`,
    );
  }

  const requestText = formData.get("request")?.toString().trim();

  if (!requestText) {
    return redirect(
      `${redirectBase}?error=Debes+escribir+tu+duda+antes+de+solicitar+ayuda`,
    );
  }

  // Comprobar que no haya ya una solicitud activa (pending o assigned)
  const { data: existing } = await supabaseAdmin
    .from("assistance_requests")
    .select("id")
    .eq("project_id", membership.project_id)
    .in("status", ["pending", "assigned"])
    .maybeSingle();

  if (existing) {
    return redirect(
      `${redirectBase}?error=Ya+tienes+una+solicitud+de+ayuda+activa`,
    );
  }

  const { error: insertError } = await supabaseAdmin
    .from("assistance_requests")
    .insert({
      project_id: membership.project_id,
      request: requestText,
      status: "pending",
    });

  if (insertError) {
    return redirect(
      `${redirectBase}?error=${encodeURIComponent("Error al crear la solicitud: " + insertError.message)}`,
    );
  }

  return redirect(redirectBase);
};

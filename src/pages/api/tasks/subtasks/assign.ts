import type { APIRoute } from "astro";
import { supabaseAdmin } from "../../../../lib/supabase";

export const POST: APIRoute = async ({ request, cookies, redirect }) => {
  const accessToken = cookies.get("sb-access-token");
  if (!accessToken) return redirect("/signin");

  const {
    data: { user },
    error: userError,
  } = await supabaseAdmin.auth.getUser(accessToken.value);

  if (userError || !user) return redirect("/signin");

  const formData = await request.formData();
  const subtaskId = formData.get("subtask_id");
  const action = formData.get("action"); // "assign" or "unassign"

  if (!subtaskId || !action) {
    return new Response("Missing subtask_id or action", { status: 400 });
  }

  const newAssignedTo = action === "assign" ? user.id : null;

  const { error } = await supabaseAdmin
    .from("subtasks")
    .update({ assigned_to: newAssignedTo })
    .eq("id", subtaskId);

  if (error) {
    console.error("Error updating subtask assignment:", error);
    return new Response("Error updating assignment", { status: 500 });
  }

  const referer = request.headers.get("referer") || "/tasks";
  return redirect(referer);
};

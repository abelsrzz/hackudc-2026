import type { APIRoute } from "astro";
import { supabaseAdmin } from "../../../../lib/supabase";
import { canManageTasks } from "../../../../lib/tasks-auth";

export const POST: APIRoute = async ({ request, cookies }) => {
  const accessToken = cookies.get("sb-access-token")?.value;
  if (!accessToken) return new Response("No autenticado", { status: 401 });

  const {
    data: { user },
    error: userError,
  } = await supabaseAdmin.auth.getUser(accessToken.valueOf());
  if (userError || !user)
    return new Response("No autenticado", { status: 401 });

  const formData = await request.formData();
  const subtaskId = formData.get("subtask_id")?.toString();
  const action = formData.get("action")?.toString();
  const projectIdRaw = formData.get("project_id")?.toString();
  const projectId = projectIdRaw ? Number(projectIdRaw) : null;

  if (!subtaskId || !action)
    return new Response("Missing subtask_id or action", { status: 400 });

  // For project tasks, any member can assign/unassign to themselves.
  // canManageTasks already covers this: project member OR mentor/admin.
  const allowed = await canManageTasks(user.id, projectId);
  if (!allowed) return new Response("No autorizado", { status: 403 });

  const newAssignedTo = action === "assign" ? user.id : null;

  const { error } = await supabaseAdmin
    .from("subtasks")
    .update({ assigned_to: newAssignedTo })
    .eq("id", subtaskId);

  if (error) return new Response("Error updating assignment", { status: 500 });

  const referer =
    request.headers.get("referer") || (projectId ? "/projects" : "/tasks");
  return Response.redirect(referer, 303);
};

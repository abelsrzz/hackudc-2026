import { supabaseAdmin } from "./supabase";

/**
 * Checks if the user is authorized to manage tasks.
 * - If projectId is provided: user must be a project member.
 * - If no projectId: user must be mentor or admin.
 */
export async function canManageTasks(
  userId: string,
  projectId: number | null,
): Promise<boolean> {
  if (projectId) {
    const { data } = await supabaseAdmin
      .from("project_member")
      .select("id")
      .eq("project_id", projectId)
      .eq("member_id", userId)
      .maybeSingle();
    return !!data;
  } else {
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("role")
      .eq("id", userId)
      .single();
    const role = profile?.role?.toLowerCase();
    return role === "mentor" || role === "admin";
  }
}

import { requireUser } from "./auth";
import { ApiException } from "./errors";
import { createServiceRoleClient } from "@/lib/supabase/server";

/**
 * Ensures the caller is an admin. Returns the authed user + a service-role
 * client (bypasses RLS) for cross-user admin operations.
 */
export async function requireAdmin() {
  const { user, supabase } = await requireUser();
  const { data } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (data?.role !== "admin") {
    throw new ApiException("FORBIDDEN", "Chỉ admin mới có quyền này");
  }
  return { user, supabase, service: createServiceRoleClient() };
}

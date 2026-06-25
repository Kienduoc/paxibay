import { createClient } from "@/lib/supabase/server";
import { ApiException } from "./errors";

/**
 * Returns the authenticated user or throws UNAUTHORIZED.
 * Use in API route handlers wrapped with try/catch + handleApiError.
 */
export async function requireUser() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) {
    throw new ApiException("UNAUTHORIZED", "Phải đăng nhập trước");
  }
  return { user, supabase };
}

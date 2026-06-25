import type { SupabaseClient } from "@supabase/supabase-js";
import { ApiException } from "./errors";

/**
 * Deduct credits from a user. Admins are unlimited (no deduction).
 * Throws QUOTA_EXCEEDED if not enough credits. Uses the authed client
 * (RLS allows updating own profile).
 */
export async function spendCredits(
  supabase: SupabaseClient,
  userId: string,
  amount: number,
  event: string,
  payload: Record<string, unknown> = {},
): Promise<void> {
  const { data, error } = await supabase
    .from("profiles")
    .select("role, credits_total, credits_used")
    .eq("id", userId)
    .single();
  if (error || !data) throw new ApiException("INTERNAL", "Không đọc được credit");

  if (data.role === "admin") return; // unlimited

  const remaining = data.credits_total - data.credits_used;
  if (remaining < amount) {
    throw new ApiException(
      "QUOTA_EXCEEDED",
      `Không đủ credit (cần ${amount}, còn ${remaining}). Liên hệ admin để được cấp thêm.`,
    );
  }

  await supabase
    .from("profiles")
    .update({ credits_used: data.credits_used + amount })
    .eq("id", userId);

  await supabase.from("usage_events").insert({
    user_id: userId,
    event,
    payload: { ...payload, credits_spent: amount },
  });
}

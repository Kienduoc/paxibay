/**
 * Fetch + decrypt a user's BYOK secret for a given provider.
 * Returns null if user hasn't configured one (caller falls back to server defaults).
 */
import { createServiceRoleClient } from "@/lib/supabase/server";
import { decryptSecret } from "@/lib/crypto";

export async function getUserByok(
  userId: string,
  provider: string,
): Promise<{ secret: string; extra_meta: Record<string, string> } | null> {
  const supabase = createServiceRoleClient();
  const { data } = await supabase
    .from("api_keys")
    .select("encrypted_key, extra_meta")
    .eq("user_id", userId)
    .eq("provider", provider)
    .order("last_used_at", { ascending: false, nullsFirst: false })
    .limit(1)
    .maybeSingle();
  if (!data) return null;
  try {
    const secret = decryptSecret(data.encrypted_key);
    return { secret, extra_meta: data.extra_meta ?? {} };
  } catch (e) {
    console.error("[byok] decrypt failed", e);
    return null;
  }
}

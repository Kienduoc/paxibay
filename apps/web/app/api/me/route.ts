import { NextResponse } from "next/server";
import { PLAN_QUOTAS } from "@paxibay/core";
import { requireUser } from "@/lib/api/auth";
import { handleApiError, ApiException } from "@/lib/api/errors";

export const runtime = "nodejs";

// GET /api/me — current user profile + usage
export async function GET() {
  try {
    const { user, supabase } = await requireUser();
    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();
    if (!profile) throw new ApiException("INTERNAL", "Profile not found");
    const quota = PLAN_QUOTAS[profile.plan as keyof typeof PLAN_QUOTAS];
    return NextResponse.json({
      id: user.id,
      email: user.email,
      display_name: profile.display_name,
      avatar_url: profile.avatar_url,
      plan: profile.plan,
      usage: {
        videos_this_month: profile.videos_this_month,
        videos_quota: quota.videos_per_month === Infinity ? null : quota.videos_per_month,
        render_minutes_this_month: profile.render_minutes,
        render_minutes_quota: quota.render_minutes_per_month,
      },
      preferences: {
        default_llm: profile.default_llm,
        default_voice: profile.default_voice,
        default_voice_code: profile.default_voice_code,
      },
    });
  } catch (e) {
    return handleApiError(e);
  }
}

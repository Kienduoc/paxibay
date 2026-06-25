import { NextResponse } from "next/server";
import { z } from "zod";
import { PLAN_QUOTAS, creditsRemaining } from "@paxibay/core";
import { requireUser } from "@/lib/api/auth";
import { handleApiError, ApiException } from "@/lib/api/errors";

export const runtime = "nodejs";

// GET /api/me — profile + role + credits + plan + payment status
export async function GET() {
  try {
    const { user, supabase } = await requireUser();
    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();
    if (!profile) throw new ApiException("INTERNAL", "Profile not found");

    const { data: sub } = await supabase
      .from("subscriptions")
      .select("status, current_period_end, cancel_at_period_end")
      .eq("user_id", user.id)
      .maybeSingle();

    const quota = PLAN_QUOTAS[profile.plan as keyof typeof PLAN_QUOTAS];

    return NextResponse.json({
      id: user.id,
      email: profile.email ?? user.email,
      display_name: profile.display_name,
      avatar_url: profile.avatar_url,
      role: profile.role,
      plan: profile.plan,
      is_active: profile.is_active,
      phone: profile.phone,
      company: profile.company,
      credits: {
        total: profile.credits_total,
        used: profile.credits_used,
        remaining: creditsRemaining(profile),
      },
      payment: {
        status: sub?.status ?? "free",
        current_period_end: sub?.current_period_end ?? null,
        cancel_at_period_end: sub?.cancel_at_period_end ?? false,
      },
      usage: {
        videos_this_month: profile.videos_this_month,
        videos_quota: quota.videos_per_month === Infinity ? null : quota.videos_per_month,
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

const patchSchema = z.object({
  display_name: z.string().min(1).max(120).optional(),
  phone: z.string().max(30).optional(),
  company: z.string().max(120).optional(),
  default_llm: z.string().max(40).optional(),
  default_voice: z.string().max(40).optional(),
  default_voice_code: z.string().max(100).optional(),
});

// PATCH /api/me — update own profile info / preferences (NOT role/credits/plan)
export async function PATCH(request: Request) {
  try {
    const { user, supabase } = await requireUser();
    const input = patchSchema.parse(await request.json());
    const { data, error } = await supabase
      .from("profiles")
      .update(input)
      .eq("id", user.id)
      .select("display_name, phone, company")
      .single();
    if (error) throw new ApiException("INTERNAL", error.message);
    return NextResponse.json(data);
  } catch (e) {
    return handleApiError(e);
  }
}

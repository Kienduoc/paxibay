import { NextResponse } from "next/server";
import { createProjectInputSchema, PLAN_QUOTAS } from "@paxibay/core";
import { requireUser } from "@/lib/api/auth";
import { handleApiError, ApiException } from "@/lib/api/errors";

export const runtime = "nodejs";

// POST /api/projects — create a draft project
export async function POST(request: Request) {
  try {
    const { user, supabase } = await requireUser();
    const body = await request.json();
    const input = createProjectInputSchema.parse(body);

    // Load profile for quota + plan
    const { data: profile } = await supabase
      .from("profiles")
      .select("plan, videos_this_month")
      .eq("id", user.id)
      .single();
    if (!profile) throw new ApiException("INTERNAL", "Profile not found");
    const quota = PLAN_QUOTAS[profile.plan as keyof typeof PLAN_QUOTAS];
    if (profile.videos_this_month >= quota.videos_per_month) {
      throw new ApiException(
        "QUOTA_EXCEEDED",
        `Đã đạt ${quota.videos_per_month} video tháng này. Nâng cấp Pro để tiếp tục.`,
      );
    }
    if (input.duration_target_s > quota.max_duration_s) {
      throw new ApiException(
        "QUOTA_EXCEEDED",
        `Plan của bạn giới hạn ${quota.max_duration_s}s/video. Nâng cấp để tăng.`,
      );
    }

    const { data, error } = await supabase
      .from("projects")
      .insert({
        user_id: user.id,
        title: input.topic.substring(0, 80),
        ...input,
      })
      .select()
      .single();
    if (error) throw new ApiException("INTERNAL", error.message);

    // Increment quota
    await supabase
      .from("profiles")
      .update({ videos_this_month: profile.videos_this_month + 1 })
      .eq("id", user.id);

    return NextResponse.json(data, { status: 201 });
  } catch (e) {
    return handleApiError(e);
  }
}

// GET /api/projects — list user's projects (paginated)
export async function GET(request: Request) {
  try {
    const { user, supabase } = await requireUser();
    const url = new URL(request.url);
    const q = url.searchParams.get("q") ?? "";
    const template = url.searchParams.get("template");
    const status = url.searchParams.get("status");
    const page = parseInt(url.searchParams.get("page") ?? "1", 10);
    const perPage = Math.min(50, parseInt(url.searchParams.get("per_page") ?? "10", 10));

    let query = supabase
      .from("project_overview")
      .select("*", { count: "exact" })
      .eq("user_id", user.id);
    if (q) query = query.ilike("title", `%${q}%`);
    if (template) query = query.eq("template", template);
    if (status) query = query.eq("status", status);

    const from = (page - 1) * perPage;
    const { data, count, error } = await query
      .order("updated_at", { ascending: false })
      .range(from, from + perPage - 1);
    if (error) throw new ApiException("INTERNAL", error.message);

    return NextResponse.json({
      items: data ?? [],
      total: count ?? 0,
      page,
      per_page: perPage,
    });
  } catch (e) {
    return handleApiError(e);
  }
}

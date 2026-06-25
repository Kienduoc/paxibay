import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api/admin";
import { handleApiError } from "@/lib/api/errors";

export const runtime = "nodejs";

// GET /api/admin/users — list all users (admin only)
export async function GET() {
  try {
    const { service } = await requireAdmin();
    const { data, error } = await service
      .from("profiles")
      .select(
        "id, email, display_name, role, plan, credits_total, credits_used, is_active, company, phone, created_at",
      )
      .order("created_at", { ascending: false });
    if (error) throw error;
    return NextResponse.json({ users: data ?? [] });
  } catch (e) {
    return handleApiError(e);
  }
}

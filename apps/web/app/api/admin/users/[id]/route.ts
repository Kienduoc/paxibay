import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/api/admin";
import { handleApiError, ApiException } from "@/lib/api/errors";

export const runtime = "nodejs";

const patchSchema = z.object({
  role: z.enum(["admin", "user"]).optional(),
  plan: z.enum(["free", "pro", "business"]).optional(),
  credits_total: z.number().int().min(0).max(1_000_000_000).optional(),
  credits_used: z.number().int().min(0).optional(),
  is_active: z.boolean().optional(),
});

// PATCH /api/admin/users/:id — admin updates a user's role/plan/credits/status
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { user, service } = await requireAdmin();

    // safety: an admin cannot demote themselves (avoid lockout)
    const input = patchSchema.parse(await request.json());
    if (id === user.id && input.role === "user") {
      throw new ApiException("VALIDATION_ERROR", "Không thể tự gỡ quyền admin của chính mình");
    }

    // Update profile (service role bypasses RLS)
    const { data, error } = await service
      .from("profiles")
      .update(input)
      .eq("id", id)
      .select("id, email, role, plan, credits_total, credits_used, is_active")
      .single();
    if (error) throw new ApiException("INTERNAL", error.message);

    // Keep subscriptions.plan in sync if plan changed
    if (input.plan) {
      await service.from("subscriptions").update({ plan: input.plan }).eq("user_id", id);
    }

    // Audit log
    await service.from("usage_events").insert({
      user_id: id,
      event: "admin_update",
      payload: { by: user.id, changes: input },
    });

    return NextResponse.json(data);
  } catch (e) {
    return handleApiError(e);
  }
}

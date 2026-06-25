import { NextResponse } from "next/server";
import { requireUser } from "@/lib/api/auth";
import { handleApiError, ApiException } from "@/lib/api/errors";

export const runtime = "nodejs";

// GET /api/renders/:id — render status
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { supabase } = await requireUser();
    const { data, error } = await supabase
      .from("renders")
      .select("id, status, progress_frames, total_frames, output_url, error_message, created_at")
      .eq("id", id)
      .single();
    if (error || !data) throw new ApiException("NOT_FOUND", "Render not found");
    const progress_pct = data.total_frames > 0
      ? Math.round((data.progress_frames / data.total_frames) * 100 * 10) / 10
      : 0;
    return NextResponse.json({ ...data, progress_pct });
  } catch (e) {
    return handleApiError(e);
  }
}

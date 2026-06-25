import { NextResponse } from "next/server";
import { requireUser } from "@/lib/api/auth";
import { handleApiError, ApiException } from "@/lib/api/errors";

export const runtime = "nodejs";

// GET /api/renders/:id/manifest — render engine fetches this with JWT.
// MVP: also serves as "download manifest JSON" for manual CLI render.
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { supabase } = await requireUser();
    const { data, error } = await supabase
      .from("renders")
      .select("manifest_snapshot, status")
      .eq("id", id)
      .single();
    if (error || !data) throw new ApiException("NOT_FOUND", "Render not found");

    return new NextResponse(JSON.stringify(data.manifest_snapshot, null, 2), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="paxibay-render-${id}.json"`,
      },
    });
  } catch (e) {
    return handleApiError(e);
  }
}

import { NextResponse } from "next/server";
import { updateSceneInputSchema } from "@paxibay/core";
import { requireUser } from "@/lib/api/auth";
import { handleApiError, ApiException } from "@/lib/api/errors";

export const runtime = "nodejs";

// PATCH /api/scenes/:id — update text / footage / visual_prompt
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { supabase } = await requireUser();
    const body = await request.json();
    const input = updateSceneInputSchema.parse(body);

    // If text changed, invalidate voice (caller regenerates via /generate/voice)
    const updates: Record<string, unknown> = { ...input };
    if (input.text !== undefined) {
      updates.voice_url = null;
      updates.voice_duration_s = null;
      updates.voice_generated_at = null;
    }

    const { data, error } = await supabase
      .from("scenes")
      .update(updates)
      .eq("id", id)
      .select()
      .single();
    if (error) throw new ApiException("INTERNAL", error.message);
    if (!data) throw new ApiException("NOT_FOUND", "Scene not found");
    return NextResponse.json(data);
  } catch (e) {
    return handleApiError(e);
  }
}

// DELETE /api/scenes/:id
export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { supabase } = await requireUser();
    const { error } = await supabase.from("scenes").delete().eq("id", id);
    if (error) throw new ApiException("INTERNAL", error.message);
    return new NextResponse(null, { status: 204 });
  } catch (e) {
    return handleApiError(e);
  }
}

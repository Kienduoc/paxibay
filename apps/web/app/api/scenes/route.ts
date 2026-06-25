import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/api/auth";
import { handleApiError, ApiException } from "@/lib/api/errors";

export const runtime = "nodejs";

const addSceneSchema = z.object({
  project_id: z.string().uuid(),
  text: z.string().min(1).max(2000).default("Scene mới — sửa nội dung tại đây."),
  visual_prompt: z.string().max(500).default("abstract background"),
  position: z.number().int().nonnegative().optional(),
});

// POST /api/scenes — append a new scene (or insert at position)
export async function POST(request: Request) {
  try {
    const { supabase } = await requireUser();
    const input = addSceneSchema.parse(await request.json());

    // Determine position: explicit, or max+1 (append)
    const { data: existing } = await supabase
      .from("scenes")
      .select("position")
      .eq("project_id", input.project_id)
      .order("position", { ascending: false })
      .limit(1);
    const nextPos = input.position ?? ((existing?.[0]?.position ?? -1) + 1);

    // Generate a slug
    const slug = `scene-${String(nextPos + 1).padStart(2, "0")}`;

    const { data, error } = await supabase
      .from("scenes")
      .insert({
        project_id: input.project_id,
        position: nextPos,
        slug,
        text: input.text,
        visual_prompt: input.visual_prompt,
      })
      .select()
      .single();
    if (error) throw new ApiException("INTERNAL", error.message);

    return NextResponse.json(data, { status: 201 });
  } catch (e) {
    return handleApiError(e);
  }
}

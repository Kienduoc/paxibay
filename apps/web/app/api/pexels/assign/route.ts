import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/api/auth";
import { handleApiError, ApiException } from "@/lib/api/errors";
import { downloadPexelsVideo } from "@/lib/providers/pexels";
import { uploadToStorage } from "@/lib/supabase/storage";

export const runtime = "nodejs";
export const maxDuration = 60;

const inputSchema = z.object({
  scene_id: z.string().uuid(),
  pexels_id: z.number().int(),
  file_url: z.string().url(),
  width: z.number().int().optional(),
  height: z.number().int().optional(),
  duration_s: z.number().optional(),
});

export async function POST(request: Request) {
  try {
    const { user, supabase } = await requireUser();
    const input = inputSchema.parse(await request.json());

    const { data: scene } = await supabase
      .from("scenes")
      .select("id, project_id")
      .eq("id", input.scene_id)
      .single();
    if (!scene) throw new ApiException("NOT_FOUND", "Scene not found");

    // Download from Pexels
    const buf = await downloadPexelsVideo(input.file_url);

    // Upload to Storage
    const path = `${user.id}/${scene.project_id}/${input.scene_id}.mp4`;
    const upload = await uploadToStorage({
      bucket: "footage",
      path,
      body: buf,
      contentType: "video/mp4",
    });

    // Update scene
    const { data: updated, error } = await supabase
      .from("scenes")
      .update({
        footage_url: upload.url,
        footage_source: "pexels",
        footage_meta: {
          pexels_id: input.pexels_id,
          width: input.width,
          height: input.height,
          duration_s: input.duration_s,
        },
      })
      .eq("id", input.scene_id)
      .select()
      .single();
    if (error) throw new ApiException("INTERNAL", error.message);

    return NextResponse.json(updated);
  } catch (e) {
    return handleApiError(e);
  }
}

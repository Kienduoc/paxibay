import { NextResponse } from "next/server";
import { startRenderInputSchema, CREDIT_COSTS } from "@paxibay/core";
import { requireUser } from "@/lib/api/auth";
import { handleApiError, ApiException } from "@/lib/api/errors";
import { buildManifest } from "@/lib/api/manifest";
import { pickMusicTrack } from "@/lib/providers/music";
import { spendCredits } from "@/lib/api/credits";

export const runtime = "nodejs";

// POST /api/renders — start a render (currently local-only; cloud TODO)
export async function POST(request: Request) {
  try {
    const { user, supabase } = await requireUser();
    const input = startRenderInputSchema.parse(await request.json());

    const { data: project, error: pErr } = await supabase
      .from("projects")
      .select("*")
      .eq("id", input.project_id)
      .single();
    if (pErr || !project) throw new ApiException("NOT_FOUND", "Project not found");

    const { data: scenes, error: sErr } = await supabase
      .from("scenes")
      .select("*")
      .eq("project_id", input.project_id)
      .order("position", { ascending: true });
    if (sErr || !scenes || scenes.length === 0) {
      throw new ApiException("MANIFEST_INVALID", "Project has no scenes");
    }

    // Verify every scene has voice + footage
    const missing = scenes.filter((s) => !s.voice_url || !s.footage_url);
    if (missing.length > 0) {
      throw new ApiException(
        "MANIFEST_INVALID",
        `${missing.length} scene chưa có voice/footage. Generate trước khi render.`,
      );
    }

    // Verify timeline computed
    if (project.total_frames === 0) {
      throw new ApiException(
        "MANIFEST_INVALID",
        "Timeline chưa được build. Gọi /api/manifest/build trước.",
      );
    }

    // Create render row
    const { data: render, error: rErr } = await supabase
      .from("renders")
      .insert({
        project_id: input.project_id,
        user_id: user.id,
        template: project.template,
        aspect_ratio: project.aspect_ratio,
        quality: input.quality ?? project.quality,
        location: input.location ?? "local",
        status: "queued",
        total_frames: project.total_frames,
        manifest_snapshot: {},  // filled below
      })
      .select()
      .single();
    if (rErr || !render) throw new ApiException("INTERNAL", rErr?.message ?? "Render insert failed");

    // Pick music track
    const musicUrl = await pickMusicTrack(project.music_vibe);

    // Build manifest (placeholder upload URL — real engine flow would use signed upload)
    const manifest = buildManifest({
      project,
      scenes,
      music_url: musicUrl,
      upload_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/renders/${render.id}/upload`,
      upload_token: "engine-todo",
      render_id: render.id,
    });

    // Save snapshot
    await supabase
      .from("renders")
      .update({ manifest_snapshot: manifest })
      .eq("id", render.id);

    // Deduct credits for the render (admins exempt)
    await spendCredits(supabase, user.id, CREDIT_COSTS.render, "credit_render", {
      project_id: input.project_id,
      render_id: render.id,
    });

    return NextResponse.json({
      render_id: render.id,
      status: "queued",
      manifest_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/renders/${render.id}/manifest`,
      // MVP placeholder: engine app not built yet — let user download manifest
      download_manifest_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/renders/${render.id}/manifest`,
      // Future: deep_link: "paxibay://render?token=...",
      note: "Render Engine chưa publish. Tải manifest về và dùng Remotion CLI thủ công (xem docs).",
    });
  } catch (e) {
    return handleApiError(e);
  }
}

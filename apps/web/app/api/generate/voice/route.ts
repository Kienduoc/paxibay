import { NextResponse } from "next/server";
import { generateVoiceInputSchema } from "@paxibay/core";
import { requireUser } from "@/lib/api/auth";
import { handleApiError, ApiException } from "@/lib/api/errors";
import { synthesize } from "@/lib/providers/tts";
import { uploadToStorage } from "@/lib/supabase/storage";
import { getUserByok } from "@/lib/api/byok";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    const { user, supabase } = await requireUser();
    const input = generateVoiceInputSchema.parse(await request.json());

    // Determine scenes to process
    let sceneIds: string[];
    let projectId: string;
    if (input.scene_id) {
      const { data } = await supabase
        .from("scenes")
        .select("id, project_id")
        .eq("id", input.scene_id)
        .single();
      if (!data) throw new ApiException("NOT_FOUND", "Scene not found");
      sceneIds = [data.id];
      projectId = data.project_id;
    } else if (input.project_id) {
      projectId = input.project_id;
      let q = supabase.from("scenes").select("id").eq("project_id", input.project_id);
      if (input.scope === "missing-only") {
        q = q.is("voice_url", null);
      }
      const { data } = await q.order("position", { ascending: true });
      sceneIds = (data ?? []).map((s) => s.id);
    } else {
      throw new ApiException("VALIDATION_ERROR", "scene_id or project_id required");
    }

    if (sceneIds.length === 0) {
      return NextResponse.json({ scenes_processed: 0, scenes_failed: 0 });
    }

    // Load project for voice config
    const { data: project } = await supabase
      .from("projects")
      .select("voice_provider, voice_code, voice_speed")
      .eq("id", projectId)
      .single();
    if (!project) throw new ApiException("NOT_FOUND", "Project not found");

    // Vbee BYOK lookup
    const byok = project.voice_provider === "vbee"
      ? await getUserByok(user.id, "vbee")
      : null;
    const vbeeCreds = byok && byok.extra_meta?.app_id
      ? { app_id: byok.extra_meta.app_id, token: byok.secret }
      : undefined;

    // Process scenes sequentially (TTS is fast enough, avoids rate limits)
    let processed = 0;
    let failed = 0;
    let totalChars = 0;
    let totalDuration = 0;

    for (const sceneId of sceneIds) {
      const { data: scene } = await supabase
        .from("scenes")
        .select("text")
        .eq("id", sceneId)
        .single();
      if (!scene || !scene.text) {
        failed++;
        continue;
      }
      try {
        const result = await synthesize(
          project.voice_provider,
          {
            text: scene.text,
            voice_code: project.voice_code,
            speed: project.voice_speed,
          },
          vbeeCreds,
        );
        const path = `${user.id}/${projectId}/${sceneId}.mp3`;
        const upload = await uploadToStorage({
          bucket: "voice",
          path,
          body: result.mp3,
          contentType: "audio/mpeg",
        });
        await supabase
          .from("scenes")
          .update({
            voice_url: upload.url,
            voice_duration_s: result.duration_estimate_s,
            voice_generated_at: new Date().toISOString(),
          })
          .eq("id", sceneId);
        processed++;
        totalChars += scene.text.length;
        totalDuration += result.duration_estimate_s;
      } catch (e) {
        console.error(`[voice] scene ${sceneId} failed:`, e);
        failed++;
      }
    }

    await supabase.from("usage_events").insert({
      user_id: user.id,
      event: "voice_generated",
      project_id: projectId,
      payload: {
        voice_provider: project.voice_provider,
        scenes_processed: processed,
        scenes_failed: failed,
        voice_chars: totalChars,
      },
    });

    return NextResponse.json({
      scenes_processed: processed,
      scenes_failed: failed,
      total_chars: totalChars,
      total_duration_s: totalDuration,
    });
  } catch (e) {
    return handleApiError(e);
  }
}

import type { Project, RenderManifest, Scene } from "@paxibay/core";
import { ASPECT_DIMENSIONS, FPS } from "@paxibay/core";

/**
 * Compute scene start frames + project total_frames.
 * Mutates scene timing in place (caller persists to DB).
 */
export function computeTimeline(scenes: Scene[]): { scenes: Scene[]; total_frames: number } {
  let cum = 0;
  const updated = scenes.map((s) => {
    const duration_frames = s.voice_duration_s ? Math.round(s.voice_duration_s * FPS) : 0;
    const next: Scene = {
      ...s,
      start_frame: cum,
      duration_frames,
    };
    cum += duration_frames;
    return next;
  });
  return { scenes: updated, total_frames: cum + 30 /* closing buffer */ };
}

/**
 * Build a RenderManifest from a project + its scenes.
 * Throws if any required field missing (validate before render).
 */
export function buildManifest(opts: {
  project: Project;
  scenes: Scene[];
  music_url: string;
  upload_url: string;
  upload_token: string;
  render_id: string;
}): RenderManifest {
  const { width, height } = ASPECT_DIMENSIONS[opts.project.aspect_ratio];
  const sceneManifests = opts.scenes.map((s) => {
    if (!s.voice_url || !s.footage_url || s.start_frame === null || s.duration_frames === null) {
      throw new Error(`Scene ${s.id} missing voice_url, footage_url or timeline`);
    }
    return {
      slug: s.slug,
      text: s.text,
      start_frame: s.start_frame,
      duration_frames: s.duration_frames,
      voice_url: s.voice_url,
      footage_url: s.footage_url,
    };
  });
  return {
    render_id: opts.render_id,
    remotion_composition: opts.project.template,
    fps: FPS,
    width,
    height,
    total_frames: opts.project.total_frames,
    scenes: sceneManifests,
    music_url: opts.music_url,
    music_volume: opts.project.music_volume,
    upload_url: opts.upload_url,
    upload_token: opts.upload_token,
  };
}

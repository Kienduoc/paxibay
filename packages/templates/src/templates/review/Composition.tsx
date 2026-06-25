/**
 * Review template — based on the Bố Già 8-min POC.
 * Each scene = full-bleed background video (Ken Burns) + dark gradient + narration text.
 * Lessons get a red "BÀI HỌC #N" badge in the top-left.
 *
 * Accepts a RenderManifest as props so it's fully driven by external data.
 * No hard-coded scenes — works for any topic.
 */
import {
  AbsoluteFill,
  Audio,
  interpolate,
  OffthreadVideo,
  Sequence,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import type { RenderManifest, SceneManifest } from "@paxibay/core";
import { SceneFader } from "../../shared/SceneFader";

export const ReviewComposition: React.FC<RenderManifest> = (manifest) => {
  const frame = useCurrentFrame();

  const finalFade = interpolate(
    frame,
    [manifest.total_frames - 25, manifest.total_frames - 1],
    [1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );

  return (
    <AbsoluteFill style={{ background: "#000", opacity: finalFade }}>
      <Audio src={manifest.music_url} volume={manifest.music_volume} loop />

      {manifest.scenes.map((scene, i) => {
        const next = manifest.scenes[i + 1];
        const crossfade = 12;
        const sceneDuration = scene.duration_frames + (next ? crossfade : 0);
        const { isLesson, num } = detectLesson(scene.slug);

        return (
          <Sequence
            key={scene.slug}
            from={scene.start_frame}
            durationInFrames={sceneDuration}
          >
            <SceneFader
              sceneDuration={sceneDuration}
              fadeIn={i === 0 ? 18 : crossfade}
              fadeOut={next ? crossfade : 25}
            >
              <ReviewScene
                scene={scene}
                duration={sceneDuration}
                isLesson={isLesson}
                lessonNumber={num}
              />
              <Audio src={scene.voice_url} volume={1.0} />
            </SceneFader>
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};

const ReviewScene: React.FC<{
  scene: SceneManifest;
  duration: number;
  isLesson: boolean;
  lessonNumber: string | null;
}> = ({ scene, duration, isLesson, lessonNumber }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Ken Burns: slow zoom 1.0 → 1.12
  const zoom = interpolate(f, [0, duration], [1.0, 1.12]);
  const driftSign = scene.slug.charCodeAt(scene.slug.length - 1) % 2 === 0 ? 1 : -1;
  const driftX = interpolate(f, [0, duration], [0, 30 * driftSign]);

  // Text fade in/out
  const textOp = interpolate(
    f,
    [0, 15, duration - 20, duration],
    [0, 1, 1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );
  const textY = interpolate(f, [0, 25], [40, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const badgeEnter = spring({
    frame: f - 5,
    fps,
    config: { damping: 12, stiffness: 100 },
  });

  return (
    <AbsoluteFill>
      <AbsoluteFill
        style={{
          transform: `scale(${zoom}) translateX(${driftX}px)`,
          transformOrigin: "center center",
        }}
      >
        <OffthreadVideo
          src={scene.footage_url}
          muted
          playbackRate={0.85}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      </AbsoluteFill>

      <AbsoluteFill
        style={{
          background:
            "linear-gradient(to bottom, rgba(2,6,23,0.55) 0%, rgba(2,6,23,0.65) 40%, rgba(2,6,23,0.95) 100%)",
        }}
      />

      {isLesson && lessonNumber && (
        <div
          style={{
            position: "absolute",
            top: 60,
            left: 80,
            transform: `scale(${badgeEnter})`,
            background: "rgba(220, 38, 38, 0.9)",
            color: "white",
            fontSize: 28,
            fontWeight: 900,
            padding: "14px 28px",
            borderRadius: 8,
            letterSpacing: 4,
            boxShadow: "0 8px 30px rgba(0,0,0,0.5)",
          }}
        >
          BÀI HỌC #{lessonNumber}
        </div>
      )}

      <div
        style={{
          position: "absolute",
          left: 120,
          right: 120,
          bottom: 90,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          opacity: textOp,
          transform: `translateY(${textY}px)`,
        }}
      >
        <div
          style={{
            color: "white",
            fontSize: 42,
            fontWeight: 600,
            lineHeight: 1.45,
            textAlign: "center",
            textShadow: "0 4px 20px rgba(0,0,0,0.9)",
            maxWidth: 1500,
            fontFamily: "Segoe UI, Inter, sans-serif",
          }}
        >
          {scene.text}
        </div>
      </div>
    </AbsoluteFill>
  );
};

function detectLesson(slug: string): { isLesson: boolean; num: string | null } {
  const m = slug.match(/lesson(\d+)/);
  if (m && m[1]) return { isLesson: true, num: m[1] };
  return { isLesson: false, num: null };
}

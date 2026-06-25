/**
 * App Intro template — bright, energetic, no lesson badges.
 * Same scene structure as review but with brand-color accent + faster motion.
 * Driven entirely by RenderManifest.
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

export const AppIntroComposition: React.FC<RenderManifest> = (manifest) => {
  const frame = useCurrentFrame();
  const finalFade = interpolate(
    frame,
    [manifest.total_frames - 25, manifest.total_frames - 1],
    [1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );

  return (
    <AbsoluteFill style={{ background: "#020617", opacity: finalFade }}>
      <Audio src={manifest.music_url} volume={manifest.music_volume} loop />

      {manifest.scenes.map((scene, i) => {
        const next = manifest.scenes[i + 1];
        const crossfade = 10;
        const sceneDuration = scene.duration_frames + (next ? crossfade : 0);
        const isFirst = i === 0;
        const isLast = !next;
        return (
          <Sequence key={scene.slug} from={scene.start_frame} durationInFrames={sceneDuration}>
            <SceneFader
              sceneDuration={sceneDuration}
              fadeIn={isFirst ? 18 : crossfade}
              fadeOut={isLast ? 25 : crossfade}
            >
              <AppIntroScene scene={scene} duration={sceneDuration} index={i} />
              <Audio src={scene.voice_url} volume={1.0} />
            </SceneFader>
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};

const AppIntroScene: React.FC<{
  scene: SceneManifest;
  duration: number;
  index: number;
}> = ({ scene, duration, index }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Subtle zoom + horizontal drift
  const zoom = interpolate(f, [0, duration], [1.02, 1.1]);
  const driftDir = index % 2 === 0 ? 1 : -1;
  const driftX = interpolate(f, [0, duration], [0, 25 * driftDir]);

  // Text spring up
  const textEnter = spring({ frame: f - 8, fps, config: { damping: 14, stiffness: 90 } });
  const textOp = interpolate(
    f,
    [0, 20, duration - 15, duration],
    [0, 1, 1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );

  return (
    <AbsoluteFill>
      {/* BG video with Ken Burns */}
      <AbsoluteFill
        style={{
          transform: `scale(${zoom}) translateX(${driftX}px)`,
          transformOrigin: "center",
        }}
      >
        <OffthreadVideo
          src={scene.footage_url}
          muted
          playbackRate={0.9}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      </AbsoluteFill>

      {/* Brand-tinted gradient — emerald glow at edges */}
      <AbsoluteFill
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(2,6,23,0.3) 0%, rgba(2,6,23,0.85) 80%)",
        }}
      />
      <AbsoluteFill
        style={{
          background:
            "linear-gradient(180deg, transparent 0%, transparent 50%, rgba(16, 185, 129, 0.06) 100%)",
        }}
      />

      {/* Scene number badge — minimal */}
      <div
        style={{
          position: "absolute",
          top: 60,
          left: 80,
          color: "#10b981",
          fontSize: 22,
          fontWeight: 800,
          letterSpacing: 4,
          opacity: interpolate(f, [0, 25], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
        }}
      >
        {String(index + 1).padStart(2, "0")} / {scene.slug.toUpperCase()}
      </div>

      {/* Big centered text */}
      <AbsoluteFill
        style={{
          justifyContent: "center",
          alignItems: "center",
          padding: "100px 140px",
        }}
      >
        <div
          style={{
            color: "white",
            fontSize: scene.text.length < 80 ? 76 : 52,
            fontWeight: 800,
            lineHeight: 1.15,
            textAlign: "center",
            letterSpacing: -1,
            textShadow: "0 4px 30px rgba(0,0,0,0.8)",
            maxWidth: 1500,
            opacity: textOp,
            transform: `translateY(${interpolate(textEnter, [0, 1], [40, 0])}px)`,
            fontFamily: "Segoe UI, Inter, sans-serif",
          }}
        >
          {scene.text}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

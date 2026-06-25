import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";

export const SceneFader: React.FC<{
  sceneDuration: number;
  fadeIn: number;
  fadeOut: number;
  children: React.ReactNode;
}> = ({ sceneDuration, fadeIn, fadeOut, children }) => {
  const f = useCurrentFrame();
  const op = interpolate(
    f,
    [0, fadeIn, sceneDuration - fadeOut, sceneDuration],
    [0, 1, 1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );
  return <AbsoluteFill style={{ opacity: op }}>{children}</AbsoluteFill>;
};

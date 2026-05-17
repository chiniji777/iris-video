import React from "react";
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

export type MotionPreset =
  | "none"
  | "pop-in"
  | "slide-up"
  | "slide-down"
  | "slide-left"
  | "slide-right"
  | "zoom-in"
  | "zoom-out"
  | "ken-burns"
  | "ken-burns-reverse"
  | "glow-pulse"
  | "float"
  | "cards-stagger"
  | "blur-in"
  | "rotate-in";

export type Motion =
  | MotionPreset
  | {
      preset: MotionPreset;
      intensity?: number;
      delayFrames?: number;
      durationFrames?: number;
    };

export const parseMotion = (
  m: Motion | undefined,
): { preset: MotionPreset; intensity: number; delay: number; duration?: number } => {
  if (!m) return { preset: "none", intensity: 1, delay: 0 };
  if (typeof m === "string") return { preset: m, intensity: 1, delay: 0 };
  return {
    preset: m.preset,
    intensity: m.intensity ?? 1,
    delay: m.delayFrames ?? 0,
    duration: m.durationFrames,
  };
};

type WrapProps = {
  motion: Motion | undefined;
  totalFrames: number;
  children: React.ReactNode;
};

export const MotionWrapper: React.FC<WrapProps> = ({ motion, totalFrames, children }) => {
  const { preset, intensity, delay, duration } = parseMotion(motion);
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = Math.max(0, frame - delay);
  const animDur = duration ?? Math.min(totalFrames, fps * 1.5);

  if (preset === "none") return <>{children}</>;

  // Spring-based scale for pop-in
  const popScale = spring({
    frame: t,
    fps,
    config: { damping: 12, stiffness: 180, mass: 0.6 },
  });

  // Linear progress 0..1 over animDur
  const p = interpolate(t, [0, animDur], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const fade = p;

  // Loop progress for continuous effects
  const loop = (frame % (fps * 3)) / (fps * 3); // 3-second loop
  const loopSin = Math.sin(loop * Math.PI * 2);

  // Ken Burns linear from 0..1 across whole scene
  const sceneP = interpolate(frame, [0, totalFrames], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  let transform = "";
  let opacity = 1;
  let filter = "";

  switch (preset) {
    case "pop-in":
      transform = `scale(${popScale * intensity + (1 - intensity)})`;
      opacity = fade;
      break;
    case "slide-up":
      transform = `translateY(${(1 - p) * 60 * intensity}px)`;
      opacity = fade;
      break;
    case "slide-down":
      transform = `translateY(${(1 - p) * -60 * intensity}px)`;
      opacity = fade;
      break;
    case "slide-left":
      transform = `translateX(${(1 - p) * 80 * intensity}px)`;
      opacity = fade;
      break;
    case "slide-right":
      transform = `translateX(${(1 - p) * -80 * intensity}px)`;
      opacity = fade;
      break;
    case "zoom-in": {
      const s = 1 + (1 - p) * 0.25 * intensity;
      transform = `scale(${s})`;
      opacity = fade;
      break;
    }
    case "zoom-out": {
      const s = 0.85 + p * 0.15 * intensity;
      transform = `scale(${s})`;
      opacity = fade;
      break;
    }
    case "ken-burns": {
      const s = 1 + sceneP * 0.15 * intensity;
      const x = sceneP * -30 * intensity;
      const y = sceneP * -20 * intensity;
      transform = `scale(${s}) translate(${x}px, ${y}px)`;
      break;
    }
    case "ken-burns-reverse": {
      const s = 1.15 - sceneP * 0.15 * intensity;
      const x = (1 - sceneP) * -30 * intensity;
      const y = (1 - sceneP) * -20 * intensity;
      transform = `scale(${s}) translate(${x}px, ${y}px)`;
      break;
    }
    case "glow-pulse": {
      const glow = 6 + (loopSin + 1) * 10 * intensity;
      filter = `drop-shadow(0 0 ${glow}px rgba(167, 139, 250, 0.55))`;
      transform = `scale(${1 + (loopSin + 1) * 0.01 * intensity})`;
      opacity = fade;
      break;
    }
    case "float": {
      const offset = loopSin * 12 * intensity;
      transform = `translateY(${offset}px)`;
      opacity = fade;
      break;
    }
    case "blur-in": {
      const blurAmt = (1 - p) * 18 * intensity;
      filter = `blur(${blurAmt}px)`;
      opacity = fade;
      break;
    }
    case "rotate-in": {
      const deg = (1 - p) * -12 * intensity;
      transform = `rotate(${deg}deg) scale(${0.9 + p * 0.1})`;
      opacity = fade;
      break;
    }
    case "cards-stagger":
      // handled via CSS @keyframes injection — see scenes.tsx
      opacity = fade;
      break;
  }

  return (
    <AbsoluteFill
      style={{
        opacity,
        transform,
        filter,
        transformOrigin: "center center",
        willChange: "transform, opacity, filter",
      }}
    >
      {children}
    </AbsoluteFill>
  );
};

// Animated gradient background — shifts between colors over time
export const AnimatedGradient: React.FC<{
  colors: string[];
  angle?: number;
  speed?: number;
}> = ({ colors, angle = 135, speed = 1 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const period = fps * 8 * (1 / speed);
  const phase = (frame % period) / period;
  const stops = colors
    .map((c, i) => {
      const pos = (i / Math.max(1, colors.length - 1)) * 100;
      const shifted = (pos + phase * 100) % 100;
      return `${c} ${shifted.toFixed(1)}%`;
    })
    .sort((a, b) => {
      const ap = parseFloat(a.split(" ").pop() ?? "0");
      const bp = parseFloat(b.split(" ").pop() ?? "0");
      return ap - bp;
    })
    .join(", ");
  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(${angle}deg, ${stops})`,
      }}
    />
  );
};

// Floating sparkles overlay (deterministic per frame so render is stable)
export const Sparkles: React.FC<{ count?: number; color?: string }> = ({
  count = 28,
  color = "#fef3c7",
}) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const dots = Array.from({ length: count }, (_, i) => {
    const seed = i * 9301 + 49297;
    const baseX = (seed % 233280) / 233280;
    const baseY = ((seed * 7) % 233280) / 233280;
    const driftPeriod = fps * (3 + (i % 5));
    const drift = Math.sin(((frame + i * 13) / driftPeriod) * Math.PI * 2);
    const x = baseX * width + drift * 30;
    const y = baseY * height + Math.cos(((frame + i * 7) / driftPeriod) * Math.PI * 2) * 20;
    const size = 2 + (i % 4);
    const twinkle = 0.3 + (Math.sin((frame + i * 5) / 12) + 1) * 0.35;
    return (
      <div
        key={i}
        style={{
          position: "absolute",
          left: x,
          top: y,
          width: size,
          height: size,
          borderRadius: "50%",
          background: color,
          opacity: twinkle,
          boxShadow: `0 0 ${size * 3}px ${color}`,
        }}
      />
    );
  });
  return <AbsoluteFill style={{ pointerEvents: "none" }}>{dots}</AbsoluteFill>;
};

// Stagger CSS — injected when scene.motion=cards-stagger so each child fades+slides in
export const STAGGER_CSS = `
.iris-stagger > * {
  opacity: 0;
  animation: iris-stagger-in 0.7s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}
.iris-stagger > *:nth-child(1) { animation-delay: 0.1s; }
.iris-stagger > *:nth-child(2) { animation-delay: 0.25s; }
.iris-stagger > *:nth-child(3) { animation-delay: 0.4s; }
.iris-stagger > *:nth-child(4) { animation-delay: 0.55s; }
.iris-stagger > *:nth-child(5) { animation-delay: 0.7s; }
.iris-stagger > *:nth-child(6) { animation-delay: 0.85s; }
@keyframes iris-stagger-in {
  from { opacity: 0; transform: translateY(40px) scale(0.95); }
  to   { opacity: 1; transform: translateY(0)    scale(1);    }
}
`;

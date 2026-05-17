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
  // Entrance
  | "pop-in"
  | "bounce-in"
  | "elastic-in"
  | "slide-up"
  | "slide-down"
  | "slide-left"
  | "slide-right"
  | "zoom-in"
  | "zoom-out"
  | "blur-in"
  | "rotate-in"
  | "flip-x"
  | "flip-y"
  | "swing-in"
  | "spin-in"
  | "drop-in"
  // Cinematic
  | "ken-burns"
  | "ken-burns-reverse"
  // Loop / continuous
  | "glow-pulse"
  | "float"
  | "breathe"
  | "tilt-loop"
  | "pulse"
  | "shake"
  | "wave"
  | "drift"
  | "pendulum"
  | "shimmer"
  | "glitch"
  // HTML-only (CSS keyframes)
  | "cards-stagger"
  | "cards-cascade"
  | "cards-zoom-stagger";

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

// Deterministic pseudo-random — same seed always gives same value (render-safe)
const rand = (seed: number) => {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
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

  // Spring presets
  const popScale = spring({
    frame: t,
    fps,
    config: { damping: 12, stiffness: 180, mass: 0.6 },
  });
  const bounceScale = spring({
    frame: t,
    fps,
    config: { damping: 8, stiffness: 220, mass: 0.5 },
  });
  const elasticScale = spring({
    frame: t,
    fps,
    config: { damping: 5, stiffness: 200, mass: 0.7 },
  });

  // Linear progress 0..1 over animDur
  const p = interpolate(t, [0, animDur], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const fade = p;

  // Continuous loop helpers
  const loopSec = (sec: number) =>
    Math.sin(((frame / (fps * sec)) % 1) * Math.PI * 2);
  const loop3 = loopSec(3);
  const loop2 = loopSec(2);
  const loop1 = loopSec(1);

  // Scene-wide progress 0..1 (for ken-burns)
  const sceneP = interpolate(frame, [0, totalFrames], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  let transform = "";
  let opacity = 1;
  let filter = "";

  switch (preset) {
    // ---------- Entrance ----------
    case "pop-in":
      transform = `scale(${popScale * intensity + (1 - intensity)})`;
      opacity = fade;
      break;
    case "bounce-in":
      transform = `scale(${bounceScale}) translateY(${(1 - bounceScale) * -40 * intensity}px)`;
      opacity = fade;
      break;
    case "elastic-in":
      transform = `scale(${elasticScale * intensity + (1 - intensity)})`;
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
    case "flip-x": {
      const deg = (1 - p) * -90 * intensity;
      transform = `perspective(1200px) rotateX(${deg}deg)`;
      opacity = fade;
      break;
    }
    case "flip-y": {
      const deg = (1 - p) * -90 * intensity;
      transform = `perspective(1200px) rotateY(${deg}deg)`;
      opacity = fade;
      break;
    }
    case "swing-in": {
      const deg = (1 - p) * -20 * intensity;
      transform = `rotate(${deg}deg) translateX(${(1 - p) * -40 * intensity}px)`;
      opacity = fade;
      break;
    }
    case "spin-in": {
      const deg = (1 - p) * 360 * intensity;
      const s = 0.3 + p * 0.7;
      transform = `rotate(${deg}deg) scale(${s})`;
      opacity = fade;
      break;
    }
    case "drop-in": {
      const y = (1 - p) * -200 * intensity;
      const sq = 1 - (1 - p) * 0.1;
      transform = `translateY(${y}px) scaleY(${sq})`;
      opacity = fade;
      break;
    }

    // ---------- Cinematic ----------
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

    // ---------- Loop / continuous ----------
    case "glow-pulse": {
      const glow = 6 + (loop3 + 1) * 10 * intensity;
      filter = `drop-shadow(0 0 ${glow}px rgba(167, 139, 250, 0.55))`;
      transform = `scale(${1 + (loop3 + 1) * 0.01 * intensity})`;
      opacity = fade;
      break;
    }
    case "float": {
      transform = `translateY(${loop3 * 12 * intensity}px)`;
      opacity = fade;
      break;
    }
    case "breathe": {
      const s = 1 + (loop3 + 1) * 0.015 * intensity;
      transform = `scale(${s})`;
      opacity = fade;
      break;
    }
    case "tilt-loop": {
      const deg = loop3 * 3 * intensity;
      transform = `rotate(${deg}deg)`;
      opacity = fade;
      break;
    }
    case "pulse": {
      const s = 1 + (loop1 + 1) * 0.03 * intensity;
      transform = `scale(${s})`;
      opacity = fade;
      break;
    }
    case "shake": {
      const x = loop1 * 4 * intensity + Math.sin(frame * 0.7) * 2 * intensity;
      const y = Math.cos(frame * 0.5) * 2 * intensity;
      transform = `translate(${x}px, ${y}px)`;
      opacity = fade;
      break;
    }
    case "wave": {
      const x = loop2 * 30 * intensity;
      const r = loop3 * 2 * intensity;
      transform = `translateX(${x}px) rotate(${r}deg)`;
      opacity = fade;
      break;
    }
    case "drift": {
      const x = Math.sin((frame / (fps * 6)) * Math.PI * 2) * 18 * intensity;
      const y = Math.cos((frame / (fps * 5)) * Math.PI * 2) * 12 * intensity;
      transform = `translate(${x}px, ${y}px)`;
      opacity = fade;
      break;
    }
    case "pendulum": {
      const deg = loop2 * 6 * intensity;
      transform = `rotate(${deg}deg)`;
      transformOriginHack(); // no-op; reminder transform-origin top default
      opacity = fade;
      break;
    }
    case "shimmer": {
      const hue = loop3 * 25 * intensity;
      filter = `hue-rotate(${hue}deg) brightness(${1 + (loop2 + 1) * 0.04 * intensity})`;
      opacity = fade;
      break;
    }
    case "glitch": {
      // Step every few frames so RGB-split flicker reads as glitch (deterministic)
      const step = Math.floor(frame / 3);
      const dx = (rand(step) - 0.5) * 8 * intensity;
      const dy = (rand(step + 7) - 0.5) * 6 * intensity;
      const split = (rand(step + 13) - 0.5) * 6 * intensity;
      transform = `translate(${dx}px, ${dy}px)`;
      filter = `drop-shadow(${split}px 0 0 rgba(239, 68, 68, 0.7)) drop-shadow(${-split}px 0 0 rgba(56, 189, 248, 0.7))`;
      opacity = fade;
      break;
    }

    // ---------- HTML stagger variants (CSS-driven, see scenes.tsx) ----------
    case "cards-stagger":
    case "cards-cascade":
    case "cards-zoom-stagger":
      opacity = fade;
      break;
  }

  return (
    <AbsoluteFill
      style={{
        opacity,
        transform,
        filter,
        transformOrigin: preset === "pendulum" ? "top center" : "center center",
        willChange: "transform, opacity, filter",
      }}
    >
      {children}
    </AbsoluteFill>
  );
};

// no-op helper kept to silence "unused variable" pattern; transform-origin is
// set inline above for pendulum.
function transformOriginHack() {}

// ============================================================================
// BACKGROUND FX
// ============================================================================

// Animated gradient — shifts color stops over time
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
    <AbsoluteFill style={{ background: `linear-gradient(${angle}deg, ${stops})` }} />
  );
};

export const Sparkles: React.FC<{ count?: number; color?: string }> = ({
  count = 28,
  color = "#fef3c7",
}) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const dots = Array.from({ length: count }, (_, i) => {
    const baseX = rand(i * 9.3);
    const baseY = rand(i * 7.7 + 3);
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

// Twinkling stars — small, deterministic, with depth illusion
export const Stars: React.FC<{ count?: number; color?: string }> = ({
  count = 80,
  color = "#ffffff",
}) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const dots = Array.from({ length: count }, (_, i) => {
    const x = rand(i * 3.1) * width;
    const y = rand(i * 5.7) * height;
    const depth = rand(i * 2.3);
    const size = 1 + depth * 2;
    const twinkle = 0.2 + (Math.sin((frame + i * 9) / 18) + 1) * 0.4 * (0.5 + depth * 0.5);
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
          boxShadow: `0 0 ${size * 2}px ${color}`,
        }}
      />
    );
  });
  return <AbsoluteFill style={{ pointerEvents: "none" }}>{dots}</AbsoluteFill>;
};

// Large soft blurred circles (depth-of-field bokeh)
export const Bokeh: React.FC<{ count?: number; colors?: string[] }> = ({
  count = 10,
  colors = ["#a78bfa", "#f0abfc", "#38bdf8", "#fef3c7"],
}) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const circles = Array.from({ length: count }, (_, i) => {
    const period = fps * (10 + (i % 5) * 2);
    const t = (frame + i * 23) / period;
    const baseX = rand(i * 4.2) * width;
    const baseY = rand(i * 6.1) * height;
    const dx = Math.sin(t * Math.PI * 2) * 80;
    const dy = Math.cos(t * Math.PI * 2) * 60;
    const size = 120 + rand(i * 8.7) * 200;
    const color = colors[i % colors.length];
    return (
      <div
        key={i}
        style={{
          position: "absolute",
          left: baseX + dx - size / 2,
          top: baseY + dy - size / 2,
          width: size,
          height: size,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${color}55 0%, transparent 70%)`,
          filter: "blur(20px)",
        }}
      />
    );
  });
  return <AbsoluteFill style={{ pointerEvents: "none" }}>{circles}</AbsoluteFill>;
};

// Aurora — large blurred gradient blobs drifting slowly
export const Aurora: React.FC<{ colors?: string[] }> = ({
  colors = ["#a78bfa", "#34d399", "#38bdf8"],
}) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const blobs = colors.map((color, i) => {
    const period = fps * (14 + i * 3);
    const t = (frame + i * 47) / period;
    const x = (Math.sin(t * Math.PI * 2) * 0.5 + 0.5) * width - width * 0.25;
    const y = (Math.cos(t * Math.PI * 2 + i) * 0.5 + 0.5) * height - height * 0.25;
    return (
      <div
        key={i}
        style={{
          position: "absolute",
          left: x,
          top: y,
          width: width * 0.7,
          height: height * 0.7,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${color}aa 0%, transparent 65%)`,
          filter: "blur(60px)",
          mixBlendMode: "screen",
        }}
      />
    );
  });
  return <AbsoluteFill style={{ pointerEvents: "none" }}>{blobs}</AbsoluteFill>;
};

// Animated grid lines (cyberpunk / data-viz vibe)
export const GridLines: React.FC<{
  color?: string;
  spacing?: number;
  speed?: number;
}> = ({ color = "rgba(167, 139, 250, 0.18)", spacing = 60, speed = 1 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const offset = ((frame * speed) / fps) * 12;
  return (
    <AbsoluteFill
      style={{
        backgroundImage: `
          linear-gradient(${color} 1px, transparent 1px),
          linear-gradient(90deg, ${color} 1px, transparent 1px)
        `,
        backgroundSize: `${spacing}px ${spacing}px`,
        backgroundPosition: `${offset}px ${offset}px`,
        pointerEvents: "none",
      }}
    />
  );
};

// Sine-wave SVG layer (decorative wave at bottom)
export const Waves: React.FC<{ color?: string; amplitude?: number }> = ({
  color = "#a78bfa",
  amplitude = 40,
}) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const phase = (frame / (fps * 4)) * Math.PI * 2;
  const points: string[] = [];
  const steps = 60;
  for (let i = 0; i <= steps; i++) {
    const x = (i / steps) * width;
    const y =
      height -
      120 +
      Math.sin((i / steps) * Math.PI * 3 + phase) * amplitude;
    points.push(`${x.toFixed(0)},${y.toFixed(0)}`);
  }
  const path = `M0,${height} L${points.join(" L")} L${width},${height} Z`;
  return (
    <svg
      width={width}
      height={height}
      style={{ position: "absolute", inset: 0, pointerEvents: "none" }}
    >
      <path d={path} fill={color} opacity={0.5} />
    </svg>
  );
};

// Radial light rays from center
export const LightRays: React.FC<{ color?: string; speed?: number }> = ({
  color = "rgba(254, 243, 199, 0.18)",
  speed = 1,
}) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const rot = ((frame * speed) / fps) * 20;
  return (
    <AbsoluteFill
      style={{
        background: `conic-gradient(from ${rot}deg at 50% 50%, transparent 0deg, ${color} 10deg, transparent 20deg, ${color} 30deg, transparent 40deg, ${color} 50deg, transparent 60deg)`,
        mixBlendMode: "screen",
        pointerEvents: "none",
        width: width * 2,
        height: height * 2,
        left: -width / 2,
        top: -height / 2,
      }}
    />
  );
};

// Falling confetti (rectangles tumbling)
export const Confetti: React.FC<{ count?: number; colors?: string[] }> = ({
  count = 80,
  colors = ["#fef3c7", "#f0abfc", "#a78bfa", "#34d399", "#fb7185", "#38bdf8"],
}) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const pieces = Array.from({ length: count }, (_, i) => {
    const startX = rand(i * 3.7) * width;
    const fallPeriod = fps * (4 + rand(i * 2.1) * 3);
    const t = ((frame + i * 17) % fallPeriod) / fallPeriod;
    const x = startX + Math.sin((t + rand(i * 5.3)) * Math.PI * 4) * 30;
    const y = t * (height + 60) - 30;
    const rot = (frame + i * 11) * (3 + rand(i * 4.2) * 5);
    const w = 8 + rand(i * 9.1) * 10;
    const h = 4 + rand(i * 6.3) * 6;
    const color = colors[i % colors.length];
    return (
      <div
        key={i}
        style={{
          position: "absolute",
          left: x,
          top: y,
          width: w,
          height: h,
          background: color,
          transform: `rotate(${rot}deg)`,
          opacity: 0.95,
        }}
      />
    );
  });
  return <AbsoluteFill style={{ pointerEvents: "none" }}>{pieces}</AbsoluteFill>;
};

// Floating hearts
export const Hearts: React.FC<{ count?: number; color?: string }> = ({
  count = 18,
  color = "#fb7185",
}) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const items = Array.from({ length: count }, (_, i) => {
    const startX = rand(i * 4.2) * width;
    const period = fps * (5 + rand(i * 2.3) * 4);
    const t = ((frame + i * 21) % period) / period;
    const x = startX + Math.sin((t + rand(i * 5.7)) * Math.PI * 4) * 40;
    const y = height - t * (height + 80) + 40;
    const size = 24 + rand(i * 7.1) * 22;
    const fade = Math.sin(t * Math.PI);
    return (
      <div
        key={i}
        style={{
          position: "absolute",
          left: x,
          top: y,
          fontSize: size,
          color,
          opacity: fade,
          textShadow: `0 0 12px ${color}`,
          filter: "drop-shadow(0 0 4px rgba(0,0,0,0.2))",
        }}
      >
        ♥
      </div>
    );
  });
  return <AbsoluteFill style={{ pointerEvents: "none" }}>{items}</AbsoluteFill>;
};

// Falling snowflakes
export const Snow: React.FC<{ count?: number; color?: string }> = ({
  count = 60,
  color = "#ffffff",
}) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const flakes = Array.from({ length: count }, (_, i) => {
    const startX = rand(i * 3.3) * width;
    const fallPeriod = fps * (6 + rand(i * 4.4) * 5);
    const t = ((frame + i * 23) % fallPeriod) / fallPeriod;
    const x = startX + Math.sin((t + rand(i * 6.1)) * Math.PI * 2) * 35;
    const y = t * (height + 30) - 30;
    const size = 3 + rand(i * 1.7) * 5;
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
          opacity: 0.85,
          boxShadow: `0 0 ${size * 2}px ${color}`,
        }}
      />
    );
  });
  return <AbsoluteFill style={{ pointerEvents: "none" }}>{flakes}</AbsoluteFill>;
};

// Falling rain lines
export const Rain: React.FC<{ count?: number; color?: string }> = ({
  count = 100,
  color = "rgba(186, 230, 253, 0.55)",
}) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const lines = Array.from({ length: count }, (_, i) => {
    const startX = rand(i * 3.9) * width;
    const fallPeriod = fps * (0.7 + rand(i * 2.1) * 0.6);
    const t = ((frame + i * 13) % fallPeriod) / fallPeriod;
    const y = t * (height + 80) - 80;
    const length = 14 + rand(i * 5.3) * 10;
    return (
      <div
        key={i}
        style={{
          position: "absolute",
          left: startX,
          top: y,
          width: 1.5,
          height: length,
          background: color,
          transform: "rotate(15deg)",
        }}
      />
    );
  });
  return <AbsoluteFill style={{ pointerEvents: "none" }}>{lines}</AbsoluteFill>;
};

// Horizontal scan lines (CRT look)
export const Scanlines: React.FC<{
  color?: string;
  spacing?: number;
}> = ({ color = "rgba(0, 0, 0, 0.18)", spacing = 4 }) => (
  <AbsoluteFill
    style={{
      backgroundImage: `repeating-linear-gradient(0deg, ${color} 0px, ${color} 1px, transparent 1px, transparent ${spacing}px)`,
      mixBlendMode: "multiply",
      pointerEvents: "none",
    }}
  />
);

// Vignette darkening around edges
export const Vignette: React.FC<{ strength?: number }> = ({ strength = 0.7 }) => (
  <AbsoluteFill
    style={{
      background: `radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,${strength}) 100%)`,
      pointerEvents: "none",
    }}
  />
);

// Subtle film-grain noise (SVG turbulence)
export const Noise: React.FC<{ opacity?: number }> = ({ opacity = 0.08 }) => (
  <AbsoluteFill
    style={{
      backgroundImage:
        "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2'/></filter><rect width='100%' height='100%' filter='url(%23n)' opacity='0.5'/></svg>\")",
      opacity,
      mixBlendMode: "overlay",
      pointerEvents: "none",
    }}
  />
);

// ============================================================================
// STAGGER VARIANTS — CSS keyframes for HTML grid layouts
// ============================================================================

export const STAGGER_CSS: Record<string, string> = {
  "cards-stagger": `
.iris-stagger > * {
  opacity: 0;
  animation: iris-stagger-in 0.7s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}
.iris-stagger > *:nth-child(1) { animation-delay: 0.10s; }
.iris-stagger > *:nth-child(2) { animation-delay: 0.25s; }
.iris-stagger > *:nth-child(3) { animation-delay: 0.40s; }
.iris-stagger > *:nth-child(4) { animation-delay: 0.55s; }
.iris-stagger > *:nth-child(5) { animation-delay: 0.70s; }
.iris-stagger > *:nth-child(6) { animation-delay: 0.85s; }
.iris-stagger > *:nth-child(7) { animation-delay: 1.00s; }
.iris-stagger > *:nth-child(8) { animation-delay: 1.15s; }
@keyframes iris-stagger-in {
  from { opacity: 0; transform: translateY(40px) scale(0.95); }
  to   { opacity: 1; transform: translateY(0) scale(1); }
}
`,
  "cards-cascade": `
.iris-stagger > * {
  opacity: 0;
  animation: iris-cascade-in 0.9s cubic-bezier(0.22, 1, 0.36, 1) forwards;
}
.iris-stagger > *:nth-child(1) { animation-delay: 0.05s; }
.iris-stagger > *:nth-child(2) { animation-delay: 0.20s; }
.iris-stagger > *:nth-child(3) { animation-delay: 0.35s; }
.iris-stagger > *:nth-child(4) { animation-delay: 0.50s; }
.iris-stagger > *:nth-child(5) { animation-delay: 0.65s; }
.iris-stagger > *:nth-child(6) { animation-delay: 0.80s; }
.iris-stagger > *:nth-child(7) { animation-delay: 0.95s; }
.iris-stagger > *:nth-child(8) { animation-delay: 1.10s; }
@keyframes iris-cascade-in {
  from { opacity: 0; transform: translateX(-80px) rotate(-3deg); }
  to   { opacity: 1; transform: translateX(0) rotate(0); }
}
`,
  "cards-zoom-stagger": `
.iris-stagger > * {
  opacity: 0;
  animation: iris-zoom-stagger 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
}
.iris-stagger > *:nth-child(1) { animation-delay: 0.10s; }
.iris-stagger > *:nth-child(2) { animation-delay: 0.22s; }
.iris-stagger > *:nth-child(3) { animation-delay: 0.34s; }
.iris-stagger > *:nth-child(4) { animation-delay: 0.46s; }
.iris-stagger > *:nth-child(5) { animation-delay: 0.58s; }
.iris-stagger > *:nth-child(6) { animation-delay: 0.70s; }
.iris-stagger > *:nth-child(7) { animation-delay: 0.82s; }
.iris-stagger > *:nth-child(8) { animation-delay: 0.94s; }
@keyframes iris-zoom-stagger {
  from { opacity: 0; transform: scale(0.4); }
  to   { opacity: 1; transform: scale(1); }
}
`,
};

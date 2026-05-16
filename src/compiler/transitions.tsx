import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import type { z } from "zod";
import type { TransitionSchema } from "../dsl/schema";

type Transition = z.infer<typeof TransitionSchema>;

export const TransitionOverlay: React.FC<{
  transition: Transition;
  totalFrames: number;
  children: React.ReactNode;
}> = ({ transition, totalFrames, children }) => {
  const frame = useCurrentFrame();
  const d = transition.durationFrames;

  if (transition.type === "none") return <>{children}</>;

  // Fade-in over first d frames, fade-out over last d frames
  const opacity =
    transition.type === "fade"
      ? Math.min(
          interpolate(frame, [0, d], [0, 1], { extrapolateRight: "clamp" }),
          interpolate(frame, [totalFrames - d, totalFrames], [1, 0], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }),
        )
      : 1;

  const slideX =
    transition.type === "slide"
      ? interpolate(frame, [0, d], [-100, 0], { extrapolateRight: "clamp" })
      : 0;

  const flipRotateY =
    transition.type === "flip"
      ? interpolate(frame, [0, d], [-90, 0], { extrapolateRight: "clamp" })
      : 0;

  // wipe + clock-wipe approximated with clip-path
  const wipeClip =
    transition.type === "wipe"
      ? `inset(0 ${interpolate(frame, [0, d], [100, 0], {
          extrapolateRight: "clamp",
        })}% 0 0)`
      : undefined;

  return (
    <AbsoluteFill
      style={{
        opacity,
        transform: `translateX(${slideX}%) perspective(1200px) rotateY(${flipRotateY}deg)`,
        clipPath: wipeClip,
      }}
    >
      {children}
    </AbsoluteFill>
  );
};

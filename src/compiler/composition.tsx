import React from "react";
import { AbsoluteFill, Sequence } from "remotion";
import type { VideoSpec } from "../dsl/schema";
import { SceneRenderer } from "./scenes";
import { TransitionOverlay } from "./transitions";

export const IrisVideoComposition: React.FC<{ spec: VideoSpec }> = ({ spec }) => {
  let cursor = 0;
  return (
    <AbsoluteFill style={{ backgroundColor: spec.background }}>
      {spec.scenes.map((scene, i) => {
        const from = cursor;
        cursor += scene.durationFrames;
        return (
          <Sequence
            key={scene.id ?? i}
            from={from}
            durationInFrames={scene.durationFrames}
            name={scene.id ?? `${scene.type}-${i}`}
          >
            {scene.transition && scene.transition.type !== "none" ? (
              <TransitionOverlay
                transition={scene.transition}
                totalFrames={scene.durationFrames}
              >
                <SceneRenderer scene={scene} />
              </TransitionOverlay>
            ) : (
              <SceneRenderer scene={scene} />
            )}
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};

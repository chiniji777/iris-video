import React from "react";
import { Composition, registerRoot } from "remotion";
import { totalDurationFrames, type VideoSpec } from "./dsl/schema";
import { IrisVideoComposition } from "./compiler/composition";

// Spec is provided at render-time via inputProps. The defaultProps below are
// only used by the studio preview before a real spec is injected.
const placeholderSpec: VideoSpec = {
  title: "iris-video",
  width: 1280,
  height: 720,
  fps: 30,
  background: "#1a1a2e",
  scenes: [
    {
      type: "title",
      durationFrames: 30,
      text: "Iris Video",
      background: "#1a1a2e",
      color: "#ffffff",
      fontSize: 96,
      fontFamily: "Sarabun, system-ui, sans-serif",
    },
  ],
};

const Root: React.FC = () => (
  <Composition
    id="IrisVideo"
    component={IrisVideoComposition as React.FC<Record<string, unknown>>}
    durationInFrames={totalDurationFrames(placeholderSpec)}
    fps={placeholderSpec.fps}
    width={placeholderSpec.width}
    height={placeholderSpec.height}
    defaultProps={{ spec: placeholderSpec }}
    calculateMetadata={({ props }) => {
      const spec = (props as { spec: VideoSpec }).spec;
      return {
        durationInFrames: totalDurationFrames(spec),
        fps: spec.fps,
        width: spec.width,
        height: spec.height,
      };
    }}
  />
);

registerRoot(Root);

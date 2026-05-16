import React from "react";
import { AbsoluteFill, Img, OffthreadVideo, useVideoConfig } from "remotion";
import type { Scene } from "../dsl/schema";

export const VideoScene: React.FC<{ scene: Extract<Scene, { type: "video" }> }> = ({ scene }) => {
  const startFrom = scene.trim?.startSec;
  const endAt = scene.trim?.endSec;
  const { fps } = useVideoConfig();
  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      <OffthreadVideo
        src={scene.src}
        muted={scene.muted}
        volume={scene.volume}
        trimBefore={startFrom ? Math.round(startFrom * fps) : undefined}
        trimAfter={endAt ? Math.round(endAt * fps) : undefined}
      />
    </AbsoluteFill>
  );
};

export const TitleScene: React.FC<{ scene: Extract<Scene, { type: "title" }> }> = ({ scene }) => (
  <AbsoluteFill
    style={{
      backgroundColor: scene.background,
      color: scene.color,
      fontFamily: scene.fontFamily,
      alignItems: "center",
      justifyContent: "center",
      flexDirection: "column",
      padding: 64,
      textAlign: "center",
    }}
  >
    <h1 style={{ fontSize: scene.fontSize, fontWeight: 700, margin: 0, lineHeight: 1.1 }}>
      {scene.text}
    </h1>
    {scene.subtitle && (
      <p style={{ fontSize: scene.fontSize * 0.4, marginTop: 24, opacity: 0.85 }}>
        {scene.subtitle}
      </p>
    )}
  </AbsoluteFill>
);

export const ImageScene: React.FC<{ scene: Extract<Scene, { type: "image" }> }> = ({ scene }) => (
  <AbsoluteFill style={{ backgroundColor: scene.background }}>
    <Img
      src={scene.src}
      style={{
        width: "100%",
        height: "100%",
        objectFit: scene.fit,
      }}
    />
  </AbsoluteFill>
);

export const HtmlScene: React.FC<{ scene: Extract<Scene, { type: "html" }> }> = ({ scene }) => (
  <AbsoluteFill style={{ backgroundColor: scene.background }}>
    {scene.css && <style dangerouslySetInnerHTML={{ __html: scene.css }} />}
    <div
      style={{ width: "100%", height: "100%" }}
      dangerouslySetInnerHTML={{ __html: scene.html }}
    />
  </AbsoluteFill>
);

export const SceneRenderer: React.FC<{ scene: Scene }> = ({ scene }) => {
  switch (scene.type) {
    case "video":
      return <VideoScene scene={scene} />;
    case "title":
      return <TitleScene scene={scene} />;
    case "image":
      return <ImageScene scene={scene} />;
    case "html":
      return <HtmlScene scene={scene} />;
  }
};

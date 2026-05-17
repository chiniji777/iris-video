import React from "react";
import { AbsoluteFill, Img, OffthreadVideo, useVideoConfig } from "remotion";
import type { Scene } from "../dsl/schema";
import { AnimatedGradient, MotionWrapper, parseMotion, Sparkles, STAGGER_CSS } from "./motion";

const BackgroundFx: React.FC<{ scene: Scene }> = ({ scene }) => {
  const fx = scene.backgroundFx;
  if (!fx) return null;
  return (
    <>
      {fx.gradient && (
        <AnimatedGradient
          colors={fx.gradient.colors}
          angle={fx.gradient.angle}
          speed={fx.gradient.speed}
        />
      )}
      {fx.sparkles && <Sparkles count={fx.sparkles.count} color={fx.sparkles.color} />}
    </>
  );
};

export const VideoScene: React.FC<{ scene: Extract<Scene, { type: "video" }> }> = ({ scene }) => {
  const startFrom = scene.trim?.startSec;
  const endAt = scene.trim?.endSec;
  const { fps } = useVideoConfig();
  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      <BackgroundFx scene={scene} />
      <MotionWrapper motion={scene.motion} totalFrames={scene.durationFrames}>
        <OffthreadVideo
          src={scene.src}
          muted={scene.muted}
          volume={scene.volume}
          trimBefore={startFrom ? Math.round(startFrom * fps) : undefined}
          trimAfter={endAt ? Math.round(endAt * fps) : undefined}
        />
      </MotionWrapper>
    </AbsoluteFill>
  );
};

export const TitleScene: React.FC<{ scene: Extract<Scene, { type: "title" }> }> = ({ scene }) => {
  const defaultMotion = scene.motion ?? "pop-in";
  return (
    <AbsoluteFill style={{ backgroundColor: scene.background }}>
      <BackgroundFx scene={scene} />
      <MotionWrapper motion={defaultMotion} totalFrames={scene.durationFrames}>
        <AbsoluteFill
          style={{
            color: scene.color,
            fontFamily: scene.fontFamily,
            alignItems: "center",
            justifyContent: "center",
            flexDirection: "column",
            padding: 64,
            textAlign: "center",
          }}
        >
          <h1
            style={{
              fontSize: scene.fontSize,
              fontWeight: 800,
              margin: 0,
              lineHeight: 1.1,
              letterSpacing: "-0.02em",
            }}
          >
            {scene.text}
          </h1>
          {scene.subtitle && (
            <p
              style={{
                fontSize: scene.fontSize * 0.4,
                marginTop: 24,
                opacity: 0.88,
                fontWeight: 500,
              }}
            >
              {scene.subtitle}
            </p>
          )}
        </AbsoluteFill>
      </MotionWrapper>
    </AbsoluteFill>
  );
};

export const ImageScene: React.FC<{ scene: Extract<Scene, { type: "image" }> }> = ({ scene }) => {
  const defaultMotion = scene.motion ?? "ken-burns";
  return (
    <AbsoluteFill style={{ backgroundColor: scene.background }}>
      <BackgroundFx scene={scene} />
      <MotionWrapper motion={defaultMotion} totalFrames={scene.durationFrames}>
        <Img
          src={scene.src}
          style={{
            width: "100%",
            height: "100%",
            objectFit: scene.fit,
          }}
        />
      </MotionWrapper>
    </AbsoluteFill>
  );
};

export const HtmlScene: React.FC<{ scene: Extract<Scene, { type: "html" }> }> = ({ scene }) => {
  const motion = parseMotion(scene.motion);
  const useStagger = motion.preset === "cards-stagger";
  return (
    <AbsoluteFill style={{ backgroundColor: scene.background }}>
      <BackgroundFx scene={scene} />
      {scene.css && <style dangerouslySetInnerHTML={{ __html: scene.css }} />}
      {useStagger && <style dangerouslySetInnerHTML={{ __html: STAGGER_CSS }} />}
      {useStagger ? (
        <div
          className="iris-stagger"
          style={{ width: "100%", height: "100%" }}
          dangerouslySetInnerHTML={{ __html: scene.html }}
        />
      ) : (
        <MotionWrapper motion={scene.motion} totalFrames={scene.durationFrames}>
          <div
            style={{ width: "100%", height: "100%" }}
            dangerouslySetInnerHTML={{ __html: scene.html }}
          />
        </MotionWrapper>
      )}
    </AbsoluteFill>
  );
};

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

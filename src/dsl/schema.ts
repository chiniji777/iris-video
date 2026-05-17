import { z } from "zod";

export const TransitionSchema = z.object({
  type: z.enum(["fade", "slide", "wipe", "flip", "clock-wipe", "none"]).default("none"),
  durationFrames: z.number().int().positive().default(15),
});

const MotionPresetEnum = z.enum([
  "none",
  "pop-in",
  "slide-up",
  "slide-down",
  "slide-left",
  "slide-right",
  "zoom-in",
  "zoom-out",
  "ken-burns",
  "ken-burns-reverse",
  "glow-pulse",
  "float",
  "cards-stagger",
  "blur-in",
  "rotate-in",
]);

export const MotionSchema = z.union([
  MotionPresetEnum,
  z.object({
    preset: MotionPresetEnum,
    intensity: z.number().min(0).max(3).optional(),
    delayFrames: z.number().int().min(0).optional(),
    durationFrames: z.number().int().positive().optional(),
  }),
]);

export const BackgroundFxSchema = z.object({
  gradient: z
    .object({
      colors: z.array(z.string()).min(2),
      angle: z.number().default(135),
      speed: z.number().positive().default(1),
    })
    .optional(),
  sparkles: z
    .object({
      count: z.number().int().positive().default(28),
      color: z.string().default("#fef3c7"),
    })
    .optional(),
});

const BaseScene = z.object({
  id: z.string().optional(),
  durationFrames: z.number().int().positive(),
  transition: TransitionSchema.optional(),
  motion: MotionSchema.optional(),
  backgroundFx: BackgroundFxSchema.optional(),
});

export const VideoSceneSchema = BaseScene.extend({
  type: z.literal("video"),
  src: z.string().min(1),
  trim: z
    .object({
      startSec: z.number().min(0).default(0),
      endSec: z.number().positive().optional(),
      autoFiller: z.boolean().default(false),
    })
    .optional(),
  volume: z.number().min(0).max(2).default(1),
  muted: z.boolean().default(false),
});

export const TitleSceneSchema = BaseScene.extend({
  type: z.literal("title"),
  text: z.string().min(1),
  subtitle: z.string().optional(),
  background: z.string().default("#1a1a2e"),
  color: z.string().default("#ffffff"),
  fontSize: z.number().int().positive().default(96),
  fontFamily: z.string().default("Sarabun, system-ui, sans-serif"),
});

export const ImageSceneSchema = BaseScene.extend({
  type: z.literal("image"),
  src: z.string().min(1),
  fit: z.enum(["cover", "contain", "fill"]).default("cover"),
  background: z.string().default("#000000"),
});

export const HtmlSceneSchema = BaseScene.extend({
  type: z.literal("html"),
  html: z.string().min(1),
  css: z.string().optional(),
  background: z.string().default("transparent"),
});

export const SceneSchema = z.discriminatedUnion("type", [
  VideoSceneSchema,
  TitleSceneSchema,
  ImageSceneSchema,
  HtmlSceneSchema,
]);
export type Scene = z.infer<typeof SceneSchema>;

export const VideoSpecSchema = z.object({
  title: z.string().default("iris-video"),
  width: z.number().int().positive().default(1920),
  height: z.number().int().positive().default(1080),
  fps: z.number().int().positive().default(30),
  background: z.string().default("#000000"),
  scenes: z.array(SceneSchema).min(1),
});
export type VideoSpec = z.infer<typeof VideoSpecSchema>;

export const totalDurationFrames = (spec: VideoSpec): number =>
  spec.scenes.reduce((sum, s) => sum + s.durationFrames, 0);

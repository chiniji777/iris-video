import { z } from "zod";

export const TransitionSchema = z.object({
  type: z.enum(["fade", "slide", "wipe", "flip", "clock-wipe", "none"]).default("none"),
  durationFrames: z.number().int().positive().default(15),
});

const MotionPresetEnum = z.enum([
  "none",
  // Entrance
  "pop-in",
  "bounce-in",
  "elastic-in",
  "slide-up",
  "slide-down",
  "slide-left",
  "slide-right",
  "zoom-in",
  "zoom-out",
  "blur-in",
  "rotate-in",
  "flip-x",
  "flip-y",
  "swing-in",
  "spin-in",
  "drop-in",
  // Cinematic
  "ken-burns",
  "ken-burns-reverse",
  // Loop / continuous
  "glow-pulse",
  "float",
  "breathe",
  "tilt-loop",
  "pulse",
  "shake",
  "wave",
  "drift",
  "pendulum",
  "shimmer",
  "glitch",
  // HTML stagger
  "cards-stagger",
  "cards-cascade",
  "cards-zoom-stagger",
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
  stars: z
    .object({
      count: z.number().int().positive().default(80),
      color: z.string().default("#ffffff"),
    })
    .optional(),
  bokeh: z
    .object({
      count: z.number().int().positive().default(10),
      colors: z.array(z.string()).optional(),
    })
    .optional(),
  aurora: z
    .object({
      colors: z.array(z.string()).min(2).optional(),
    })
    .optional(),
  grid: z
    .object({
      color: z.string().default("rgba(167, 139, 250, 0.18)"),
      spacing: z.number().int().positive().default(60),
      speed: z.number().default(1),
    })
    .optional(),
  waves: z
    .object({
      color: z.string().default("#a78bfa"),
      amplitude: z.number().default(40),
    })
    .optional(),
  lightRays: z
    .object({
      color: z.string().default("rgba(254, 243, 199, 0.18)"),
      speed: z.number().default(1),
    })
    .optional(),
  confetti: z
    .object({
      count: z.number().int().positive().default(80),
      colors: z.array(z.string()).optional(),
    })
    .optional(),
  hearts: z
    .object({
      count: z.number().int().positive().default(18),
      color: z.string().default("#fb7185"),
    })
    .optional(),
  snow: z
    .object({
      count: z.number().int().positive().default(60),
      color: z.string().default("#ffffff"),
    })
    .optional(),
  rain: z
    .object({
      count: z.number().int().positive().default(100),
      color: z.string().default("rgba(186, 230, 253, 0.55)"),
    })
    .optional(),
  scanlines: z
    .object({
      color: z.string().default("rgba(0, 0, 0, 0.18)"),
      spacing: z.number().int().positive().default(4),
    })
    .optional(),
  vignette: z
    .object({
      strength: z.number().min(0).max(1).default(0.7),
    })
    .optional(),
  noise: z
    .object({
      opacity: z.number().min(0).max(1).default(0.08),
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

import { bundle } from "@remotion/bundler";
import { renderMedia, selectComposition } from "@remotion/renderer";
import { resolve } from "node:path";
import { existsSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";
import type { VideoSpec } from "./dsl/schema";

export interface RenderOpts {
  spec: VideoSpec;
  specPath: string;
  output: string;
  verbose?: boolean;
  concurrency?: number;
}

export async function renderSpec(opts: RenderOpts): Promise<string> {
  const { spec, specPath, output, verbose = false, concurrency } = opts;
  const absOutput = resolve(output);
  mkdirSync(dirname(absOutput), { recursive: true });

  const entry = resolve(__dirname, "remotion-entry.tsx");
  if (!existsSync(entry)) throw new Error(`Entry not found: ${entry}`);

  process.env.IRIS_VIDEO_SPEC = resolve(specPath);

  if (verbose) console.log("[iris-video] bundling…");
  const serveUrl = await bundle({
    entryPoint: entry,
    onProgress: verbose ? (p) => process.stdout.write(`\r  bundle ${p}%`) : undefined,
  });
  if (verbose) process.stdout.write("\n");

  if (verbose) console.log("[iris-video] selecting composition…");
  const composition = await selectComposition({
    serveUrl,
    id: "IrisVideo",
    inputProps: { spec },
  });

  if (verbose) console.log(`[iris-video] rendering → ${absOutput}`);
  await renderMedia({
    composition,
    serveUrl,
    codec: "h264",
    outputLocation: absOutput,
    inputProps: { spec },
    concurrency,
    onProgress: verbose
      ? ({ progress }) => process.stdout.write(`\r  render ${Math.round(progress * 100)}%`)
      : undefined,
  });
  if (verbose) process.stdout.write("\n");

  return absOutput;
}

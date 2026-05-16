#!/usr/bin/env bun
import { Command } from "commander";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { parse } from "yaml";
import { VideoSpecSchema, totalDurationFrames } from "./dsl/schema";
import { renderSpec } from "./render";

const program = new Command();
program
  .name("iris-video")
  .description("Iris Video (Prism) — AI-first programmatic video compositor")
  .version("0.1.0");

program
  .command("render <spec>")
  .description("Render a video from a YAML spec")
  .option("-o, --output <path>", "Output mp4 path", "out/video.mp4")
  .option("-v, --verbose", "Verbose output", false)
  .option("-c, --concurrency <n>", "Render concurrency", (v) => parseInt(v, 10))
  .action(async (specPath: string, opts) => {
    const abs = resolve(specPath);
    const raw = readFileSync(abs, "utf8");
    const parsed = parse(raw);
    const spec = VideoSpecSchema.parse(parsed);
    if (opts.verbose) {
      console.log(`[iris-video] spec: ${spec.title}`);
      console.log(
        `  ${spec.width}×${spec.height} @ ${spec.fps}fps · ${spec.scenes.length} scenes · ${totalDurationFrames(spec)} frames`,
      );
    }
    const out = await renderSpec({
      spec,
      specPath: abs,
      output: opts.output,
      verbose: opts.verbose,
      concurrency: opts.concurrency,
    });
    console.log(`✨ done → ${out}`);
  });

program
  .command("validate <spec>")
  .description("Validate a YAML spec without rendering")
  .action((specPath: string) => {
    const abs = resolve(specPath);
    const raw = readFileSync(abs, "utf8");
    const parsed = parse(raw);
    const spec = VideoSpecSchema.parse(parsed);
    console.log(`✅ valid · ${spec.scenes.length} scenes · ${totalDurationFrames(spec)} frames`);
  });

await program.parseAsync(process.argv);

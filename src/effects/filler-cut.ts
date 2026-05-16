/**
 * Filler-word + silence auto-cut.
 *
 * Pipeline:
 *   1. Run whisper.cpp (or OpenAI Whisper API) on video → word-level timestamps
 *   2. Detect filler words (เอ่อ, อ่า, um, uh, eh) + silence > threshold
 *   3. Emit kept segments as { startSec, endSec } pairs
 *
 * MVP: shells out to whisper-cli (whisper.cpp) if installed, otherwise OpenAI
 *      Whisper API via OPENAI_API_KEY. Returns segments for downstream Sequence
 *      generation (caller splits a video scene into N trimmed sub-scenes).
 */
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync, mkdtempSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

export interface WordToken {
  start: number;
  end: number;
  word: string;
}

export interface KeepSegment {
  startSec: number;
  endSec: number;
}

const THAI_FILLERS = ["เอ่อ", "อ่า", "อืม", "เออ", "อะ", "เอิ่ม", "เอิ่ม"];
const EN_FILLERS = ["um", "uh", "uhh", "umm", "eh", "ehh", "hmm", "like", "you know"];

export function isFiller(word: string): boolean {
  const w = word.toLowerCase().trim().replace(/[.,!?]/g, "");
  if (EN_FILLERS.includes(w)) return true;
  if (THAI_FILLERS.some((f) => w === f)) return true;
  return false;
}

export function detectKeepSegments(
  words: WordToken[],
  silenceThresholdSec = 0.8,
): KeepSegment[] {
  if (words.length === 0) return [];
  const keeps: KeepSegment[] = [];
  let segStart: number | null = null;
  let prevEnd = 0;

  for (let i = 0; i < words.length; i++) {
    const w = words[i];
    if (!w) continue;
    const isSilence = w.start - prevEnd >= silenceThresholdSec;
    const skip = isFiller(w.word);

    if (skip || isSilence) {
      if (segStart !== null) {
        keeps.push({ startSec: segStart, endSec: prevEnd });
        segStart = null;
      }
      if (!skip) {
        segStart = w.start;
      }
    } else {
      if (segStart === null) segStart = w.start;
    }
    prevEnd = w.end;
  }
  if (segStart !== null) keeps.push({ startSec: segStart, endSec: prevEnd });
  return keeps;
}

export async function transcribeVideo(videoPath: string): Promise<WordToken[]> {
  if (!existsSync(videoPath)) throw new Error(`Video not found: ${videoPath}`);
  const tmp = mkdtempSync(join(tmpdir(), "iris-filler-"));
  const wav = join(tmp, "audio.wav");

  // Extract 16kHz mono wav via ffmpeg
  const ff = spawnSync("ffmpeg", ["-y", "-i", videoPath, "-ar", "16000", "-ac", "1", wav], {
    stdio: "ignore",
  });
  if (ff.status !== 0) throw new Error("ffmpeg extraction failed");

  // Prefer whisper-cli if available (free, local)
  const whisperCli = spawnSync("which", ["whisper-cli"], { encoding: "utf8" });
  if (whisperCli.stdout.trim()) {
    const out = join(tmp, "out");
    spawnSync(
      "whisper-cli",
      [
        "-m",
        process.env.WHISPER_MODEL ?? "models/ggml-base.bin",
        "-f",
        wav,
        "-oj",
        "-of",
        out,
        "-ml",
        "1",
      ],
      { stdio: "inherit" },
    );
    const json = JSON.parse(readFileSync(`${out}.json`, "utf8"));
    type WhisperSeg = { offsets?: { from: number; to: number }; text: string };
    return (json.transcription as WhisperSeg[]).map((s) => ({
      start: (s.offsets?.from ?? 0) / 1000,
      end: (s.offsets?.to ?? 0) / 1000,
      word: s.text.trim(),
    }));
  }

  // Fallback: OpenAI Whisper API
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error(
      "auto_filler requires whisper-cli (local) or OPENAI_API_KEY (cloud) — neither found",
    );
  }
  const form = new FormData();
  form.append("file", new Blob([readFileSync(wav)], { type: "audio/wav" }), "audio.wav");
  form.append("model", "whisper-1");
  form.append("response_format", "verbose_json");
  form.append("timestamp_granularities[]", "word");
  const res = await fetch("https://api.openai.com/v1/audio/transcriptions", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}` },
    body: form,
  });
  if (!res.ok) throw new Error(`Whisper API ${res.status}: ${await res.text()}`);
  const data: { words?: Array<{ word: string; start: number; end: number }> } = await res.json();
  return (data.words ?? []).map((w) => ({ start: w.start, end: w.end, word: w.word }));
}

export async function planFillerCut(
  videoPath: string,
  silenceThresholdSec = 0.8,
): Promise<KeepSegment[]> {
  const words = await transcribeVideo(videoPath);
  return detectKeepSegments(words, silenceThresholdSec);
}

// Debug helper — write segments to a JSON file for inspection
export function writeKeepSegments(segments: KeepSegment[], path: string): void {
  writeFileSync(path, JSON.stringify(segments, null, 2));
}

// Two Lines to Your Past Self — entry writer.
//
// The entry is the text itself: two lines, each a single sentence.
// Line one warns the writer's past self about one specific moment;
// line two traces what changed because of that moment.
//
// The program is deterministic: fixed text in, fixed bytes out.
// It validates the entry against the bounty gate (UTF-8 text,
// 1-280 characters, exactly two non-blank lines) before writing it
// to /output/entry.txt, and refuses to write an invalid entry.

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";

const OUTPUT_PATH = "/output/entry.txt";
const MAX_CHARS = 280;

// One specific moment, named with a time, a place and a decision:
// a Tuesday call from a hospital payphone, and a visit put off
// until Saturday. The second line lands the consequence.
const WARNING_LINES: readonly string[] = [
  "When Dad calls from the hospital payphone on Tuesday and asks you to come home, drive there that night instead of promising to visit on Saturday.",
  "He was gone by Friday, and you spent the next ten years rehearsing the goodbye you never got to say.",
];

function sentenceCount(line: string): number {
  return [...line].filter((ch) => ch === "." || ch === "!" || ch === "?").length;
}

function buildEntry(lines: readonly string[]): string {
  const trimmed = lines.map((line) => line.trim());
  if (trimmed.length !== 2) {
    throw new Error(`entry must be exactly two lines, got ${trimmed.length}`);
  }
  for (const [index, line] of trimmed.entries()) {
    if (line.length === 0) {
      throw new Error(`line ${index + 1} is empty`);
    }
    if (sentenceCount(line) !== 1 || !/[.!?]$/.test(line)) {
      throw new Error(`line ${index + 1} must be exactly one sentence`);
    }
  }
  const text = trimmed.join("\n") + "\n";
  if (text.length < 1 || text.length > MAX_CHARS) {
    throw new Error(`entry must be 1-${MAX_CHARS} characters, got ${text.length}`);
  }
  // The judge penalises a second line that restates the first, so the
  // two lines must not share their wording: they have to work as one,
  // warning first, consequence second.
  const words = (line: string): Set<string> =>
    new Set(line.toLowerCase().replace(/[^a-z\s]/g, "").split(/\s+/).filter((w) => w.length > 3));
  const first = words(trimmed[0]);
  const second = words(trimmed[1]);
  const shared = [...first].filter((w) => second.has(w));
  if (shared.length > 2) {
    throw new Error(`line 2 restates line 1 (shared words: ${shared.join(", ")})`);
  }
  return text;
}

function main(): void {
  const entry = buildEntry(WARNING_LINES);
  mkdirSync("/output", { recursive: true });
  writeFileSync(OUTPUT_PATH, entry, "utf8");
  // Read back and confirm exactly what was written, byte for byte.
  if (readFileSync(OUTPUT_PATH, "utf8") !== entry) {
    throw new Error("verification failed: /output/entry.txt differs from the entry");
  }
  process.stdout.write(entry);
}

main();

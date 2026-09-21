import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { computeRunning, markDistance } from "./running.ts";
import { RUNNING_PACE, runningSpeakLines } from "./running-speak.ts";
import { tradieNumber } from "./speak.ts";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

describe("runningSpeakLines", () => {
  const result = computeRunning({
    overall: 2400,
    member: 90,
    layout: "ends",
    countMode: "members",
    count: 5,
    maxGap: 450,
  });

  it("speaks only millimetre values — no 'mark' and no index", () => {
    expect(result).not.toBeNull();
    const lines = runningSpeakLines(result!.marks, "left");
    expect(lines).toHaveLength(result!.marks.length);
    expect(lines).toEqual(
      result!.marks.map((m) => tradieNumber(markDistance(m, "left"))),
    );
    for (const line of lines) {
      expect(line.toLowerCase()).not.toContain("mark");
    }
    expect(lines[0]).toBe(tradieNumber(0));
    expect(lines.at(-1)).toBe(tradieNumber(result!.marks.at(-1)!.left));
  });

  it("uses the selected face distance", () => {
    expect(result).not.toBeNull();
    const left = runningSpeakLines(result!.marks, "left");
    const centre = runningSpeakLines(result!.marks, "centre");
    const right = runningSpeakLines(result!.marks, "right");
    expect(centre[0]).toBe(tradieNumber(45));
    expect(right[0]).toBe(tradieNumber(90));
    expect(left[0]).not.toBe(centre[0]);
  });
});

describe("running pace", () => {
  it("pauses 1s on Quick and 3s on Normal between numbers", () => {
    expect(RUNNING_PACE.quick.gapMs).toBe(1000);
    expect(RUNNING_PACE.normal.gapMs).toBe(3000);
    expect(RUNNING_PACE.slow.gapMs).toBeGreaterThan(RUNNING_PACE.normal.gapMs);
  });
});

describe("Play marks wiring", () => {
  it("sends distance-only lines through speakLines on both TTS paths", () => {
    const tool = readFileSync(join(root, "components/tools/running-tool.tsx"), "utf8");
    expect(tool).toContain("runningSpeakLines");
    expect(tool).toContain("RUNNING_PACE[pace]");
    expect(tool).toContain("speakLines(lines");
    expect(tool).not.toMatch(/Mark \$\{/);
    expect(tool).not.toContain("That's the lot");

    const speak = readFileSync(join(root, "lib/speak.ts"), "utf8");
    expect(speak).toContain("shouldUseNativeTts");
    expect(speak).toContain('platform === "android"');
    expect(speak).toContain("createNativeEngine");
    expect(speak).toContain("createWebSpeechEngine");
    expect(speak).toContain("await gap(gapMs)");
  });
});

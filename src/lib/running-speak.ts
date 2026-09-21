import { markDistance, type RunningFace, type RunningMark } from "./running";
import { tradieNumber } from "./speak";

export const RUNNING_PACE = {
  slow: { gapMs: 5000, rate: 0.82, label: "Slow" },
  normal: { gapMs: 3000, rate: 0.92, label: "Normal" },
  quick: { gapMs: 1000, rate: 1.05, label: "Quick" },
} as const;

export type RunningPace = keyof typeof RUNNING_PACE;

/**
 * Play-marks utterances: millimetre values only.
 * Do not prefix "mark", do not announce the index.
 * Gaps between lines are applied by speakLines (native Android TTS and web speech).
 */
export function runningSpeakLines(
  marks: RunningMark[],
  face: RunningFace,
): string[] {
  return marks.map((m) => tradieNumber(markDistance(m, face)));
}

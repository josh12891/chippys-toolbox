import { parseNum } from "./format";

export type RunningLayout = "ends" | "between";
export type RunningCountMode = "members" | "spaces" | "max";

export type RunningInput = {
  overall: number;
  member: number;
  layout: RunningLayout;
  countMode: RunningCountMode;
  count: number;
  maxGap: number;
};

export type RunningMark = {
  index: number;
  left: number;
  centre: number;
  right: number;
};

export type RunningResult = {
  overall: number;
  member: number;
  members: number;
  spaces: number;
  centres: number;
  gap: number;
  layout: RunningLayout;
  marks: RunningMark[];
  leftover: number;
};

export function computeRunning(input: RunningInput): RunningResult | null {
  const L = input.overall;
  const T = input.member;
  if (!Number.isFinite(L) || !Number.isFinite(T) || L <= 0 || T <= 0) return null;
  if (T >= L) return null;

  let members: number;
  let spaces: number;
  let gap: number;
  let centres: number;
  let leftover = 0;

  if (input.layout === "ends") {
    if (input.countMode === "members") {
      members = Math.max(2, Math.round(input.count));
      spaces = members - 1;
    } else if (input.countMode === "spaces") {
      spaces = Math.max(1, Math.round(input.count));
      members = spaces + 1;
    } else {
      const maxC = input.maxGap > 0 ? input.maxGap : T + 1;
      spaces = Math.max(1, Math.ceil((L - T) / maxC));
      members = spaces + 1;
    }
    const remaining = L - members * T;
    if (remaining < 0) return null;
    gap = remaining / spaces;
    centres = (L - T) / spaces;
    leftover = remaining - gap * spaces;
  } else {
    if (input.countMode === "members") {
      members = Math.max(1, Math.round(input.count));
      spaces = members + 1;
    } else if (input.countMode === "spaces") {
      spaces = Math.max(2, Math.round(input.count));
      members = spaces - 1;
    } else {
      const maxG = input.maxGap > 0 ? input.maxGap : 125;
      members = Math.max(1, Math.ceil((L - maxG) / (T + maxG)));
      spaces = members + 1;
    }
    const remaining = L - members * T;
    if (remaining < 0) return null;
    gap = remaining / spaces;
    centres = T + gap;
    leftover = remaining - gap * spaces;
  }

  const marks: RunningMark[] = [];
  for (let i = 0; i < members; i++) {
    const left =
      input.layout === "ends" ? i * centres : gap + i * (T + gap);
    marks.push({
      index: i + 1,
      left,
      centre: left + T / 2,
      right: left + T,
    });
  }

  return {
    overall: L,
    member: T,
    members,
    spaces,
    centres,
    gap,
    layout: input.layout,
    marks,
    leftover,
  };
}

export function parseRunningField(raw: string): number | null {
  const n = parseNum(raw);
  if (n == null || n <= 0) return null;
  return n;
}

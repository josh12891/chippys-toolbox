import { clamp } from "./format";

export type StairStandardId = "ncc" | "as1657";

export type StairStandard = {
  id: StairStandardId;
  name: string;
  short: string;
  riseMin: number;
  riseMax: number;
  goingMin: number;
  goingMax: number;
  slopeMin: number;
  slopeMax: number;
  maxRisersPerFlight: number;
  minRisersPerFlight: number;
  landingMin: number;
  preferredRise: number;
  notes: string[];
};

export const STANDARDS: Record<StairStandardId, StairStandard> = {
  ncc: {
    id: "ncc",
    name: "NCC Housing",
    short: "NCC 2022 Housing Provisions 11.2",
    riseMin: 115,
    riseMax: 190,
    goingMin: 240,
    goingMax: 355,
    slopeMin: 550,
    slopeMax: 700,
    maxRisersPerFlight: 18,
    minRisersPerFlight: 2,
    landingMin: 750,
    preferredRise: 175,
    notes: [
      "Max 18 risers in each flight — a landing is required after that.",
      "Landing not less than 750 mm (600 mm if the stair serves only non-habitable rooms).",
      "Risers and goings in a flight must be uniform within ±5 mm.",
      "2R + G (twice rise plus going) must sit between 550 and 700 mm.",
    ],
  },
  as1657: {
    id: "as1657",
    name: "AS 1657",
    short: "AS 1657:2018 platforms, walkways and stairways",
    riseMin: 130,
    riseMax: 225,
    goingMin: 215,
    goingMax: 355,
    slopeMin: 540,
    slopeMax: 700,
    maxRisersPerFlight: 18,
    minRisersPerFlight: 2,
    landingMin: 600,
    preferredRise: 180,
    notes: [
      "Max 18 risers per flight. Adjacent flights are joined by a landing.",
      "Landing width not less than the stairway, and at least 600 mm clear.",
      "A person must not be able to fall more than 36 risers without a barrier, a landing ≥ 2 m, or a ≥ 90° change of direction.",
      "2R + G must sit between 540 and 700 mm.",
    ],
  },
};

export type GoingMode = "auto" | "tread" | "overall";

export type StairInput = {
  totalRiseMm: number;
  standard: StairStandardId;
  goingMode: GoingMode;
  treadGoingMm?: number;
  overallGoingMm?: number;
  stairWidthMm: number;
};

export type StairCheck = {
  ok: boolean;
  label: string;
  detail: string;
};

export type StairFlight = {
  risers: number;
  treads: number;
  riseMm: number;
  goingMm: number;
};

export type StairResult = {
  standard: StairStandard;
  totalRiseMm: number;
  riseMm: number;
  goingMm: number;
  slopeMm: number;
  risers: number;
  treads: number;
  flights: StairFlight[];
  landings: number;
  landingLengthMm: number;
  overallGoingMm: number;
  stairWidthMm: number;
  pitchDeg: number;
  landingRequired: boolean;
  maxRisersBeforeLanding: number;
  checks: StairCheck[];
  compliant: boolean;
};

function goingForRise(riseMm: number, std: StairStandard): number {
  const targetSlope = (std.slopeMin + std.slopeMax) / 2;
  return clamp(targetSlope - 2 * riseMm, std.goingMin, std.goingMax);
}

function treadsFor(risers: number, flights: number): number {
  return Math.max(0, risers - flights);
}

function splitFlights(risers: number, maxPer: number): number[] {
  if (risers <= maxPer) return [risers];
  const nFlights = Math.ceil(risers / maxPer);
  const base = Math.floor(risers / nFlights);
  const extra = risers % nFlights;
  const out: number[] = [];
  for (let i = 0; i < nFlights; i++) {
    out.push(base + (i < extra ? 1 : 0));
  }
  return out;
}

export function setOutStairs(input: StairInput): StairResult | null {
  if (!Number.isFinite(input.totalRiseMm) || input.totalRiseMm <= 0) return null;
  const std = STANDARDS[input.standard];
  const totalRise = input.totalRiseMm;

  const nMin = Math.max(std.minRisersPerFlight, Math.ceil(totalRise / std.riseMax));
  const nMax = Math.max(nMin, Math.floor(totalRise / std.riseMin));

  type Candidate = { n: number; rise: number; going: number; score: number };
  let best: Candidate | null = null;

  for (let n = nMin; n <= nMax; n++) {
    const rise = totalRise / n;
    const flights = splitFlights(n, std.maxRisersPerFlight);
    const treads = treadsFor(n, flights.length);
    let going: number;
    if (input.goingMode === "tread") {
      if (input.treadGoingMm == null || input.treadGoingMm <= 0) continue;
      going = input.treadGoingMm;
    } else if (input.goingMode === "overall") {
      if (input.overallGoingMm == null || input.overallGoingMm <= 0 || treads === 0) {
        continue;
      }
      const landingRun = (flights.length - 1) * std.landingMin;
      going = (input.overallGoingMm - landingRun) / treads;
    } else {
      going = goingForRise(rise, std);
    }
    if (!Number.isFinite(going) || going <= 0) continue;

    const slope = 2 * rise + going;
    const riseOk = rise >= std.riseMin - 0.05 && rise <= std.riseMax + 0.05;
    const goingOk = going >= std.goingMin - 0.05 && going <= std.goingMax + 0.05;
    const slopeOk = slope >= std.slopeMin - 0.05 && slope <= std.slopeMax + 0.05;
    let score = Math.abs(rise - std.preferredRise);
    if (!riseOk) score += 400;
    if (!goingOk) score += 400;
    if (!slopeOk) score += 200;
    if (input.goingMode === "auto") {
      score += Math.abs(slope - (std.slopeMin + std.slopeMax) / 2) * 0.15;
    }
    if (!best || score < best.score) best = { n, rise, going, score };
  }

  if (!best) {
    const n = Math.max(std.minRisersPerFlight, Math.round(totalRise / std.preferredRise));
    const rise = totalRise / n;
    const going =
      input.goingMode === "tread" && input.treadGoingMm
        ? input.treadGoingMm
        : goingForRise(rise, std);
    best = { n, rise, going, score: 9999 };
  }

  const risers = best.n;
  const riseMm = totalRise / risers;
  const flightCounts = splitFlights(risers, std.maxRisersPerFlight);
  const landings = flightCounts.length - 1;
  const landingRequired = landings > 0;
  const treads = treadsFor(risers, flightCounts.length);
  const goingMm = best.going;
  const landingLengthMm = landings > 0 ? std.landingMin : 0;
  const overallGoingMm = treads * goingMm + landings * landingLengthMm;
  const slopeMm = 2 * riseMm + goingMm;
  const pitchDeg = (Math.atan(riseMm / goingMm) * 180) / Math.PI;

  const check = (
    ok: boolean,
    label: string,
    detail: string,
  ): StairCheck => ({ ok, label, detail });

  const checks: StairCheck[] = [
    check(
      riseMm >= std.riseMin && riseMm <= std.riseMax,
      "Rise",
      `${std.riseMin}–${std.riseMax} mm`,
    ),
    check(
      goingMm >= std.goingMin && goingMm <= std.goingMax,
      "Going",
      `${std.goingMin}–${std.goingMax} mm`,
    ),
    check(
      slopeMm >= std.slopeMin && slopeMm <= std.slopeMax,
      "2R + G",
      `${std.slopeMin}–${std.slopeMax} mm`,
    ),
    check(
      flightCounts.every(
        (n) => n >= std.minRisersPerFlight && n <= std.maxRisersPerFlight,
      ),
      "Flight length",
      `${std.minRisersPerFlight}–${std.maxRisersPerFlight} risers per flight`,
    ),
  ];

  const flights: StairFlight[] = flightCounts.map((n) => ({
    risers: n,
    treads: n,
    riseMm,
    goingMm,
  }));

  return {
    standard: std,
    totalRiseMm: totalRise,
    riseMm,
    goingMm,
    slopeMm,
    risers,
    treads,
    flights,
    landings,
    landingLengthMm,
    overallGoingMm,
    stairWidthMm: input.stairWidthMm,
    pitchDeg,
    landingRequired,
    maxRisersBeforeLanding: std.maxRisersPerFlight,
    checks,
    compliant: checks.every((c) => c.ok),
  };
}

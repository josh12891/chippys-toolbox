export type TriangleKnown = {
  run: boolean;
  rise: boolean;
  hyp: boolean;
  angleRun: boolean;
  angleRise: boolean;
};

export type TriangleOk = {
  ok: true;
  run: number;
  rise: number;
  hyp: number;
  angleRun: number;
  angleRise: number;
  angleRight: 90;
  pitchDeg: number;
  riseToRun: string;
  is345: boolean;
  entered: TriangleKnown;
  warnings: string[];
};

export type TriangleErr = {
  ok: false;
  error: string;
  entered: TriangleKnown;
};

export type TriangleResult = TriangleOk | TriangleErr;

const RAD = Math.PI / 180;

function isPos(n: number | null | undefined): n is number {
  return n != null && Number.isFinite(n) && n > 0;
}

function roundSide(n: number): number {
  return Math.round(n * 1000) / 1000;
}

function roundDeg(n: number): number {
  return Math.round(n * 100) / 100;
}

function is345(run: number, rise: number, hyp: number): boolean {
  const sides = [run, rise, hyp].sort((a, b) => a - b);
  const k = sides[0]! / 3;
  if (k <= 0) return false;
  return (
    Math.abs(sides[1]! / k - 4) < 0.04 &&
    Math.abs(sides[2]! / k - 5) < 0.04
  );
}

export function solveRightTriangle(input: {
  run: number | null;
  rise: number | null;
  hyp: number | null;
  angleRun: number | null;
  angleRise: number | null;
}): TriangleResult {
  const entered: TriangleKnown = {
    run: isPos(input.run),
    rise: isPos(input.rise),
    hyp: isPos(input.hyp),
    angleRun: isPos(input.angleRun),
    angleRise: isPos(input.angleRise),
  };

  let run = entered.run ? input.run : null;
  let rise = entered.rise ? input.rise : null;
  let hyp = entered.hyp ? input.hyp : null;
  let angleRun = entered.angleRun ? input.angleRun : null;
  let angleRise = entered.angleRise ? input.angleRise : null;
  const warnings: string[] = [];

  if (angleRun != null && (angleRun <= 0 || angleRun >= 90)) {
    return { ok: false, error: "Angle at the run must sit between 0° and 90°.", entered };
  }
  if (angleRise != null && (angleRise <= 0 || angleRise >= 90)) {
    return { ok: false, error: "Angle at the rise must sit between 0° and 90°.", entered };
  }
  if (angleRun != null && angleRise != null) {
    if (Math.abs(angleRun + angleRise - 90) > 0.3) {
      return { ok: false, error: "The two acute angles must add to 90°.", entered };
    }
    angleRise = 90 - angleRun;
  } else if (angleRun != null) {
    angleRise = 90 - angleRun;
  } else if (angleRise != null) {
    angleRun = 90 - angleRise;
  }

  if (hyp != null && run != null && hyp <= run) {
    return { ok: false, error: "Hypotenuse must be longer than the run.", entered };
  }
  if (hyp != null && rise != null && hyp <= rise) {
    return { ok: false, error: "Hypotenuse must be longer than the rise.", entered };
  }

  const sides = [run, rise, hyp].filter((n) => n != null).length;
  const hasAngle = angleRun != null;
  if (sides >= 2) {
    // two or three sides — Pythagoras
  } else if (sides === 1 && hasAngle) {
    // SOHCAHTOA
  } else if (sides === 0 && hasAngle) {
    return { ok: false, error: "Add a side so the triangle has a size.", entered };
  } else {
    return {
      ok: false,
      error: "Enter at least two values — two sides, or a side and an angle.",
      entered,
    };
  }

  if (run != null && rise != null) {
    const h = Math.hypot(run, rise);
    if (hyp != null && Math.abs(hyp - h) / h > 0.01) {
      warnings.push("Sides don’t match Pythagoras. Drawn from run and rise.");
    }
    hyp = h;
    angleRun = Math.atan2(rise, run) / RAD;
    angleRise = 90 - angleRun;
  } else if (run != null && hyp != null) {
    rise = Math.sqrt(hyp * hyp - run * run);
    angleRun = Math.acos(run / hyp) / RAD;
    angleRise = 90 - angleRun;
  } else if (rise != null && hyp != null) {
    run = Math.sqrt(hyp * hyp - rise * rise);
    angleRun = Math.asin(rise / hyp) / RAD;
    angleRise = 90 - angleRun;
  } else {
    const th = (angleRun as number) * RAD;
    if (run != null) {
      hyp = run / Math.cos(th);
      rise = run * Math.tan(th);
    } else if (rise != null) {
      hyp = rise / Math.sin(th);
      run = rise / Math.tan(th);
    } else {
      run = (hyp as number) * Math.cos(th);
      rise = (hyp as number) * Math.sin(th);
    }
  }

  if (
    entered.angleRun &&
    input.angleRun != null &&
    Math.abs(input.angleRun - (angleRun as number)) > 0.4
  ) {
    warnings.push("Entered angle doesn’t match the sides. Drawn from the sides.");
  }

  const runN = roundSide(run as number);
  const riseN = roundSide(rise as number);
  const hypN = roundSide(hyp as number);
  const aRun = roundDeg(angleRun as number);
  const aRise = roundDeg(angleRise as number);
  const ratio = riseN === 0 ? 0 : runN / riseN;

  return {
    ok: true,
    run: runN,
    rise: riseN,
    hyp: hypN,
    angleRun: aRun,
    angleRise: aRise,
    angleRight: 90,
    pitchDeg: aRun,
    riseToRun: `1 : ${roundSide(ratio)}`,
    is345: is345(runN, riseN, hypN),
    entered,
    warnings,
  };
}

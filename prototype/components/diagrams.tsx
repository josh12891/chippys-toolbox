import { formatDeg, formatM, formatM3, formatMm, type LengthUnit } from "@/lib/format";
import type { StairResult } from "@/lib/stairs";
import type { RunningResult } from "@/lib/running";
import type { TriangleResult } from "@/lib/triangle";

export function VolumeBanner({
  caption,
  volume,
  compact,
}: {
  caption: string;
  volume: number | null;
  compact?: boolean;
}) {
  return (
    <div
      className={
        compact
          ? "flex items-end justify-between gap-2 bg-primary px-3 py-2 text-primary-fg"
          : "flex items-end justify-between gap-3 bg-primary px-4 py-3 text-primary-fg"
      }
    >
      <p className="font-display text-xs font-semibold uppercase tracking-display text-primary-fg/70">
        {caption}
      </p>
      <p
        className={
          compact
            ? "font-display text-xl font-semibold leading-none tabular-nums"
            : "font-display text-3xl font-semibold leading-none tabular-nums"
        }
      >
        {volume == null ? "—" : formatM3(volume)}
        <span className={compact ? "ml-1 text-sm font-medium" : "ml-1 text-lg font-medium"}>
          m³
        </span>
      </p>
    </div>
  );
}

function pts(corners: { x: number; y: number }[]) {
  return corners.map((c) => `${c.x},${c.y}`).join(" ");
}

export function SlabDiagram({
  height,
  width,
  depth,
  unit,
  title,
}: {
  height: number | null;
  width: number | null;
  depth: number | null;
  unit: LengthUnit;
  volume?: number | null;
  title: string;
}) {
  const toM = (n: number) => (unit === "mm" ? n / 1000 : n);
  const wM = width == null ? 4 : toM(Math.max(width, 0.01));
  const dM = depth == null ? 3 : toM(Math.max(depth, 0.01));
  const hM = height == null ? 0.1 : toM(Math.max(height, 0.01));

  const vbW = 480;
  const vbH = 280;
  const padL = 72;
  const padR = 36;
  const padT = 40;
  const padB = 48;
  const innerW = vbW - padL - padR;
  const innerH = vbH - padT - padB;

  const recede = 0.5;
  const recedeY = 0.32;
  const maxPlan = Math.max(wM, dM);
  const hVis = hM / maxPlan < 0.2 ? Math.max(hM, maxPlan * 0.1) : hM;
  const s = Math.min(
    innerW / (wM + dM * recede),
    innerH / (hVis + dM * recedeY),
  );
  const boxW = s * wM;
  const boxH = s * hVis;
  const rx = s * dM * recede;
  const ry = s * dM * recedeY;

  const ox = padL;
  const oy = vbH - padB;
  const flb = { x: ox, y: oy };
  const frb = { x: ox + boxW, y: oy };
  const frt = { x: ox + boxW, y: oy - boxH };
  const flt = { x: ox, y: oy - boxH };
  const brb = { x: frb.x + rx, y: frb.y - ry };
  const brt = { x: frt.x + rx, y: frt.y - ry };
  const blt = { x: flt.x + rx, y: flt.y - ry };

  const unitLabel = (n: number | null, axis: string) =>
    n == null
      ? `${axis} —`
      : unit === "mm"
        ? `${axis} ${formatMm(n)} mm`
        : `${axis} ${n} m`;

  return (
    <svg
      viewBox={`0 0 ${vbW} ${vbH}`}
      className="h-auto w-full"
      role="img"
      aria-label={title}
    >
      <rect width={vbW} height={vbH} className="fill-surface-2" />
      <text
        x="16"
        y="24"
        className="fill-muted"
        fontSize="11"
        fontFamily="Barlow Condensed, sans-serif"
        letterSpacing="1.6"
      >
        {title.toUpperCase()}
      </text>
      <polygon
        points={pts([frb, brb, brt, frt])}
        className="fill-dim stroke-ink"
        strokeWidth="1.4"
      />
      <polygon
        points={pts([flb, frb, frt, flt])}
        className="fill-border stroke-ink"
        strokeWidth="1.4"
      />
      <polygon
        points={pts([flt, frt, brt, blt])}
        className="fill-surface stroke-ink"
        strokeWidth="1.4"
      />
      <line
        x1={flb.x}
        y1={flb.y + 16}
        x2={frb.x}
        y2={frb.y + 16}
        className="stroke-muted"
        strokeWidth="0.8"
      />
      <text
        x={(flb.x + frb.x) / 2}
        y={flb.y + 32}
        textAnchor="middle"
        className="fill-ink"
        fontSize="13"
        fontWeight={600}
        fontFamily="Barlow, sans-serif"
      >
        {unitLabel(width, "W")}
      </text>
      <line
        x1={flb.x - 16}
        y1={flb.y}
        x2={flt.x - 16}
        y2={flt.y}
        className="stroke-muted"
        strokeWidth="0.8"
      />
      <text
        x={flb.x - 24}
        y={(flb.y + flt.y) / 2}
        textAnchor="middle"
        className="fill-ink"
        fontSize="13"
        fontWeight={600}
        fontFamily="Barlow, sans-serif"
        transform={`rotate(-90 ${flb.x - 24} ${(flb.y + flt.y) / 2})`}
      >
        {unitLabel(height, "H")}
      </text>
      <line
        x1={frb.x + 10}
        y1={frb.y + 6}
        x2={brb.x + 10}
        y2={brb.y + 6}
        className="stroke-muted"
        strokeWidth="0.8"
      />
      <text
        x={(frb.x + brb.x) / 2 + 18}
        y={(frb.y + brb.y) / 2 + 18}
        textAnchor="middle"
        className="fill-ink"
        fontSize="13"
        fontWeight={600}
        fontFamily="Barlow, sans-serif"
      >
        {unitLabel(depth, "D")}
      </text>
    </svg>
  );
}

export function FootingDiagram({
  height,
  width,
  linealM,
  unit,
}: {
  height: number | null;
  width: number | null;
  linealM: number | null;
  unit: LengthUnit;
  volume?: number | null;
}) {
  return (
    <svg viewBox="0 0 420 250" className="h-auto w-full" role="img" aria-label="Strip footing">
      <rect width="420" height="250" className="fill-surface-2" rx="12" />
      <text
        x="16"
        y="24"
        className="fill-muted"
        fontSize="11"
        fontFamily="Barlow Condensed, sans-serif"
        letterSpacing="1.6"
      >
        STRIP FOOTING
      </text>
      <polygon
        points="70,150 330,110 370,130 110,170"
        className="fill-surface stroke-ink"
        strokeWidth="1.2"
      />
      <polygon
        points="110,170 370,130 370,168 110,208"
        className="fill-border stroke-ink"
        strokeWidth="1.2"
      />
      <polygon
        points="70,150 110,170 110,208 70,188"
        className="fill-dim stroke-ink"
        strokeWidth="1.2"
      />
      <text x="200" y="88" textAnchor="middle" className="fill-ink" fontSize="12" fontWeight={600}>
        {linealM == null ? "Lineal —" : `${linealM} lineal m`}
      </text>
      <text x="52" y="178" className="fill-ink" fontSize="11" fontWeight={600}>
        {height == null ? "H —" : `H ${unit === "mm" ? `${formatMm(height)} mm` : `${height} m`}`}
      </text>
      <text x="240" y="214" className="fill-ink" fontSize="11" fontWeight={600}>
        {width == null ? "W —" : `W ${unit === "mm" ? `${formatMm(width)} mm` : `${width} m`}`}
      </text>
    </svg>
  );
}

export function PierDiagram({
  label,
  diameter,
  unit,
  depthM,
  scaleDiaM,
  scaleDepthM,
  volume,
}: {
  label: string;
  diameter: number | null;
  unit: LengthUnit;
  depthM: number | null;
  scaleDiaM: number;
  scaleDepthM: number;
  volume?: number | null;
}) {
  const toM = (n: number) => (unit === "mm" ? n / 1000 : n);
  const diaM = diameter == null || diameter <= 0 ? 0.3 : toM(diameter);
  const dM = depthM != null && depthM > 0 ? depthM : 0;
  const has = dM > 0;

  const vbW = 200;
  const vbH = 300;
  const header = 56;
  const groundY = 250;
  const maxBody = groundY - header - 8;
  const maxRx = 48;
  const rx = Math.max(10, (diaM / Math.max(scaleDiaM, 0.05)) * maxRx);
  const ry = Math.max(4, rx * 0.34);
  const bodyH = has ? Math.max(22, (dM / Math.max(scaleDepthM, 0.05)) * maxBody) : 36;
  const cx = vbW / 2;
  const topY = groundY - bodyH;
  const left = cx - rx;
  const right = cx + rx;

  const diaLabel =
    diameter == null
      ? "Ø —"
      : unit === "mm"
        ? `Ø ${formatMm(diameter)} mm`
        : `Ø ${diameter} m`;
  const depthLabel = has ? `${dM} m` : "—";

  return (
    <svg
      viewBox={`0 0 ${vbW} ${vbH}`}
      className="block h-auto w-full"
      role="img"
      aria-label={`${label}, ${diaLabel}, ${depthLabel}${volume != null ? `, ${formatM3(volume)} cubic metres` : ""}`}
    >
      <rect width={vbW} height={vbH} className="fill-surface-2" />
      <text
        x="12"
        y="22"
        className="fill-muted"
        fontSize="11"
        fontFamily="Barlow Condensed, sans-serif"
        letterSpacing="1.6"
      >
        {label.toUpperCase()}
      </text>
      <text
        x={vbW - 12}
        y="26"
        textAnchor="end"
        className="fill-primary"
        fontSize="18"
        fontWeight={700}
        fontFamily="Barlow Condensed, sans-serif"
      >
        {volume == null ? "—" : formatM3(volume)}
        <tspan fontSize="11" fontWeight={600}>
          {" m³"}
        </tspan>
      </text>
      <text
        x="12"
        y="42"
        className="fill-ink"
        fontSize="12"
        fontWeight={600}
        fontFamily="Barlow, sans-serif"
      >
        {diaLabel}
      </text>
      <text
        x={vbW - 12}
        y="42"
        textAnchor="end"
        className="fill-ink"
        fontSize="12"
        fontWeight={600}
        fontFamily="Barlow, sans-serif"
      >
        {depthLabel}
      </text>

      <line
        x1="16"
        y1={groundY}
        x2={vbW - 16}
        y2={groundY}
        className="stroke-muted"
        strokeWidth="1"
        strokeDasharray="4 3"
      />
      <text x="16" y={groundY + 18} className="fill-muted" fontSize="10">
        GL
      </text>

      <ellipse
        cx={cx}
        cy={groundY}
        rx={rx}
        ry={ry}
        className="fill-dim stroke-ink"
        strokeWidth="1.3"
      />
      <rect
        x={left}
        y={topY}
        width={rx * 2}
        height={bodyH}
        className="fill-border"
      />
      <line
        x1={left}
        y1={topY}
        x2={left}
        y2={groundY}
        className="stroke-ink"
        strokeWidth="1.3"
      />
      <line
        x1={right}
        y1={topY}
        x2={right}
        y2={groundY}
        className="stroke-ink"
        strokeWidth="1.3"
      />
      <ellipse
        cx={cx}
        cy={topY}
        rx={rx}
        ry={ry}
        className="fill-surface stroke-ink"
        strokeWidth="1.3"
      />
      <line
        x1={cx}
        y1={topY}
        x2={cx}
        y2={groundY}
        className="stroke-ink"
        strokeWidth="0.8"
        strokeDasharray="3 3"
        opacity="0.35"
      />
    </svg>
  );
}

export function StairDiagram({ result }: { result: StairResult | null }) {
  const rise = result?.riseMm ?? 175;
  const going = result?.goingMm ?? 280;
  const flights = result?.flights ?? [{ risers: 8, treads: 7, riseMm: rise, goingMm: going }];
  const landing = result?.landingLengthMm ?? 0;
  const isLastFlight = (f: number) => f === flights.length - 1;

  const seq: Array<{ type: "rise" | "going" | "landing"; w: number; h: number }> = [];
  for (let f = 0; f < flights.length; f++) {
    const fl = flights[f]!;
    const n = Math.min(fl.risers, 18);
    for (let i = 0; i < n; i++) {
      seq.push({ type: "rise", w: 0, h: rise });
      if (i < n - 1) {
        seq.push({ type: "going", w: going, h: 0 });
      } else if (!isLastFlight(f)) {
        seq.push({ type: "landing", w: Math.max(landing, going * 1.8), h: 0 });
      }
    }
  }

  const totalW = seq.reduce((a, s) => a + s.w, 0) || going * 7;
  const totalH = seq.reduce((a, s) => a + s.h, 0) || rise * 8;
  const padL = 48;
  const padB = 36;
  const padT = 36;
  const padR = 20;
  const vbW = 420;
  const vbH = 250;
  const sx = (vbW - padL - padR) / Math.max(totalW, 1);
  const sy = (vbH - padT - padB) / Math.max(totalH, 1);
  const s = Math.min(sx, sy);

  let x = padL;
  let y = vbH - padB;
  const pathPts: string[] = [`${x},${y}`];
  for (const step of seq) {
    if (step.h) {
      y -= step.h * s;
      pathPts.push(`${x},${y}`);
    }
    if (step.w) {
      x += step.w * s;
      pathPts.push(`${x},${y}`);
    }
  }
  const topX = x;
  const topY = y;
  pathPts.push(`${topX},${vbH - padB}`);
  pathPts.push(`${padL},${vbH - padB}`);

  return (
    <svg viewBox="0 0 420 250" className="h-auto w-full" role="img" aria-label="Stair set-out">
      <rect width="420" height="250" className="fill-surface-2" rx="12" />
      <text
        x="16"
        y="22"
        className="fill-muted"
        fontSize="11"
        fontFamily="Barlow Condensed, sans-serif"
        letterSpacing="1.6"
      >
        STAIR SET-OUT
      </text>
      <polygon points={pathPts.join(" ")} className="fill-surface stroke-ink" strokeWidth="1.3" />
      {result ? (
        <>
          <line
            x1={padL - 18}
            y1={vbH - padB}
            x2={padL - 18}
            y2={topY}
            className="stroke-muted"
            strokeWidth="0.8"
          />
          <text
            x={14}
            y={(vbH - padB + topY) / 2}
            className="fill-ink"
            fontSize="10"
            fontWeight={600}
            transform={`rotate(-90 14 ${(vbH - padB + topY) / 2})`}
          >
            {`${formatMm(result.totalRiseMm)} overall rise`}
          </text>
          <text x={padL} y={vbH - 10} className="fill-ink" fontSize="10" fontWeight={600}>
            {`${formatMm(result.overallGoingMm)} overall going`}
          </text>
          <text x="250" y="22" className="fill-ink" fontSize="11" fontWeight={600}>
            {`R ${formatMm(result.riseMm)}  ·  G ${formatMm(result.goingMm)}`}
          </text>
          <text x="250" y="40" className="fill-muted" fontSize="11">
            {`${result.risers} rises  ·  ${result.treads} goings`}
            {result.landings ? `  ·  ${result.landings} landing` : ""}
          </text>
        </>
      ) : (
        <text x="16" y="48" className="fill-muted" fontSize="12">
          Enter floor-to-floor height to set out
        </text>
      )}
    </svg>
  );
}

export function RunningDiagram({ result }: { result: RunningResult | null }) {
  const marks = result?.marks ?? [];
  const L = result?.overall ?? 3600;
  const T = result?.member ?? 90;
  const pad = 28;
  const y = 130;
  const w = 420 - pad * 2;
  const scale = w / L;
  const shown = marks.length > 18
    ? [...marks.slice(0, 8), ...marks.slice(-8)]
    : marks;

  return (
    <svg viewBox="0 0 420 220" className="h-auto w-full" role="img" aria-label="Running measurements">
      <rect width="420" height="220" className="fill-surface-2" rx="12" />
      <text
        x="16"
        y="22"
        className="fill-muted"
        fontSize="11"
        fontFamily="Barlow Condensed, sans-serif"
        letterSpacing="1.6"
      >
        RUNNING MARKS
      </text>
      <rect
        x={pad}
        y={y}
        width={w}
        height="10"
        className="fill-primary/80 stroke-ink"
        strokeWidth="1"
      />
      {shown.map((m, i) => {
        const x = pad + m.left * scale;
        const mw = Math.max(2, T * scale);
        const skip = marks.length > 18 && i === 8;
        if (skip) {
          return (
            <text key="gap" x="210" y="100" textAnchor="middle" className="fill-muted" fontSize="11">
              ···
            </text>
          );
        }
        return (
          <g key={m.index}>
            <rect
              x={x}
              y={y - 36}
              width={mw}
              height="46"
              className="fill-ink/90"
            />
            {marks.length <= 12 ? (
              <text
                x={x + mw / 2}
                y={y - 44}
                textAnchor="middle"
                className="fill-ink"
                fontSize="9"
                fontWeight={600}
              >
                {formatMm(m.left)}
              </text>
            ) : null}
          </g>
        );
      })}
      <text x={pad} y="200" className="fill-ink" fontSize="11" fontWeight={600}>
        0
      </text>
      <text x={pad + w} y="200" textAnchor="end" className="fill-ink" fontSize="11" fontWeight={600}>
        {formatMm(L)}
      </text>
      {result ? (
        <text x="16" y="44" className="fill-muted" fontSize="12">
          {`${result.members} members · ${formatMm(result.centres)} centres · ${formatMm(result.gap)} gap`}
        </text>
      ) : (
        <text x="16" y="44" className="fill-muted" fontSize="12">
          Enter overall length and member width
        </text>
      )}
    </svg>
  );
}

function sideText(n: number, unit: LengthUnit) {
  return unit === "mm" ? `${formatMm(n)} mm` : `${formatM(n)} m`;
}

export function TriangleDiagram({
  result,
  unit,
}: {
  result: TriangleResult | null;
  unit: LengthUnit;
}) {
  const vbW = 520;
  const vbH = 340;
  const padL = 86;
  const padR = 72;
  const padT = 56;
  const padB = 64;
  const innerW = vbW - padL - padR;
  const innerH = vbH - padT - padB;

  const run = result?.ok ? result.run : 400;
  const rise = result?.ok ? result.rise : 300;
  let visRun = run;
  let visRise = rise;
  let stretched = false;
  if (visRun / visRise > 4) {
    visRun = visRise * 4;
    stretched = true;
  } else if (visRise / visRun > 4) {
    visRise = visRun * 4;
    stretched = true;
  }
  const s = Math.min(innerW / visRun, innerH / visRise);
  const C = { x: padL, y: vbH - padB };
  const A = { x: padL + visRun * s, y: vbH - padB };
  const B = { x: padL, y: vbH - padB - visRise * s };

  const solved = result?.ok === true;
  const ghost = !solved;

  const hypMid = { x: (A.x + B.x) / 2, y: (A.y + B.y) / 2 };
  const hypDx = A.x - B.x;
  const hypDy = A.y - B.y;
  const hypLen = Math.hypot(hypDx, hypDy) || 1;
  const nx = hypDy / hypLen;
  const ny = -hypDx / hypLen;
  const hypLabel = {
    x: hypMid.x + nx * 22,
    y: hypMid.y + ny * 22,
  };
  const hypAngle = (Math.atan2(hypDy, hypDx) * 180) / Math.PI;

  const sq = Math.min(22, visRun * s * 0.18, visRise * s * 0.18);

  const hint = result && !result.ok ? result.error : "Enter two sides, or a side and an angle";

  return (
    <svg
      viewBox={`0 0 ${vbW} ${vbH}`}
      className="block h-auto w-full"
      role="img"
      aria-label={
        solved
          ? `Right triangle, run ${sideText(result.run, unit)}, rise ${sideText(result.rise, unit)}, hypotenuse ${sideText(result.hyp, unit)}`
          : "Right triangle"
      }
    >
      <rect width={vbW} height={vbH} className="fill-surface-2" />
      <text
        x="16"
        y="24"
        className="fill-muted"
        fontSize="11"
        fontFamily="Barlow Condensed, sans-serif"
        letterSpacing="1.6"
      >
        TRIANGLE CALCULATOR · 90°
      </text>
      {stretched ? (
        <text x="16" y="42" className="fill-muted" fontSize="11">
          Shape eased to fit — values are true
        </text>
      ) : null}

      <polygon
        points={`${C.x},${C.y} ${A.x},${A.y} ${B.x},${B.y}`}
        className={ghost ? "fill-surface stroke-muted" : "fill-surface stroke-ink"}
        strokeWidth="1.6"
        strokeDasharray={ghost ? "6 5" : undefined}
      />

      <path
        d={`M ${C.x} ${C.y - sq} L ${C.x + sq} ${C.y - sq} L ${C.x + sq} ${C.y}`}
        className={ghost ? "stroke-muted" : "stroke-ink"}
        fill="none"
        strokeWidth="1.4"
      />
      <text
        x={C.x + sq + 10}
        y={C.y - 8}
        className={ghost ? "fill-muted" : "fill-ink"}
        fontSize="12"
        fontWeight={600}
        fontFamily="Barlow, sans-serif"
      >
        90°
      </text>

      <text
        x={(C.x + A.x) / 2}
        y={C.y + 28}
        textAnchor="middle"
        className={ghost ? "fill-muted" : "fill-ink"}
        fontSize="14"
        fontWeight={600}
        fontFamily="Barlow, sans-serif"
      >
        {solved ? `Run ${sideText(result.run, unit)}` : "Run"}
      </text>
      <text
        x={C.x - 28}
        y={(C.y + B.y) / 2}
        textAnchor="middle"
        className={ghost ? "fill-muted" : "fill-ink"}
        fontSize="14"
        fontWeight={600}
        fontFamily="Barlow, sans-serif"
        transform={`rotate(-90 ${C.x - 28} ${(C.y + B.y) / 2})`}
      >
        {solved ? `Rise ${sideText(result.rise, unit)}` : "Rise"}
      </text>
      <text
        x={hypLabel.x}
        y={hypLabel.y}
        textAnchor="middle"
        className={ghost ? "fill-muted" : "fill-primary"}
        fontSize="14"
        fontWeight={700}
        fontFamily="Barlow, sans-serif"
        transform={`rotate(${hypAngle} ${hypLabel.x} ${hypLabel.y})`}
      >
        {solved ? `Hyp ${sideText(result.hyp, unit)}` : "Hypotenuse"}
      </text>

      {solved ? (
        <>
          <text
            x={A.x + 8}
            y={A.y - 14}
            className="fill-ink"
            fontSize="13"
            fontWeight={600}
            fontFamily="Barlow, sans-serif"
          >
            {`${formatDeg(result.angleRun)}°`}
          </text>
          <text
            x={B.x + 16}
            y={B.y + 18}
            className="fill-ink"
            fontSize="13"
            fontWeight={600}
            fontFamily="Barlow, sans-serif"
          >
            {`${formatDeg(result.angleRise)}°`}
          </text>
        </>
      ) : (
        <text x="16" y={vbH - 16} className="fill-muted" fontSize="12">
          {hint}
        </text>
      )}
    </svg>
  );
}

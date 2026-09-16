import { useState } from "react";
import { AppShell } from "@/components/app-shell";
import { NumberField, Segmented } from "@/components/fields";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TriangleDiagram } from "@/components/diagrams";
import { formatDeg, formatM, formatMm, parseNum, type LengthUnit } from "@/lib/format";
import { solveRightTriangle, type TriangleResult } from "@/lib/triangle";

function sideOut(n: number, unit: LengthUnit) {
  return unit === "mm" ? `${formatMm(n)} mm` : `${formatM(n)} m`;
}

export function TriangleTool() {
  const [unit, setUnit] = useState<LengthUnit>("mm");
  const [run, setRun] = useState("");
  const [rise, setRise] = useState("");
  const [hyp, setHyp] = useState("");
  const [angleRun, setAngleRun] = useState("");
  const [angleRise, setAngleRise] = useState("");
  const [result, setResult] = useState<TriangleResult | null>(null);
  const [committed, setCommitted] = useState<{
    run: string;
    rise: string;
    hyp: string;
    angleRun: string;
    angleRise: string;
  } | null>(null);

  const dirty = [run, rise, hyp, angleRun, angleRise].some((v) => v.trim() !== "");
  const stale =
    committed != null &&
    (committed.run !== run ||
      committed.rise !== rise ||
      committed.hyp !== hyp ||
      committed.angleRun !== angleRun ||
      committed.angleRise !== angleRise);

  const calculate = () => {
    setCommitted({ run, rise, hyp, angleRun, angleRise });
    setResult(
      solveRightTriangle({
        run: parseNum(run),
        rise: parseNum(rise),
        hyp: parseNum(hyp),
        angleRun: parseNum(angleRun),
        angleRise: parseNum(angleRise),
      }),
    );
  };

  const clear = () => {
    setRun("");
    setRise("");
    setHyp("");
    setAngleRun("");
    setAngleRise("");
    setCommitted(null);
    setResult(null);
  };

  const sideStep = unit === "mm" ? 10 : 0.01;
  const solved = result?.ok === true;

  return (
    <AppShell
      title="Triangle Calculator"
      subtitle="Right-angle set-out. Enter sides or angles, then Calculate."
      back
    >
      <Card className="mb-4">
        <CardHeader>
          <CardTitle>Known values</CardTitle>
          <CardDescription>
            One corner is 90°. Enter at least two values — two sides, or a side
            and an angle — then tap Calculate.
          </CardDescription>
        </CardHeader>
        <div className="mb-4">
          <Segmented
            ariaLabel="Length unit"
            value={unit}
            onChange={setUnit}
            options={[
              { value: "mm", label: "mm" },
              { value: "m", label: "m" },
            ]}
          />
        </div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-display text-muted">
          Sides
        </p>
        <div className="grid grid-cols-1 gap-3">
          <NumberField
            id="tri-run"
            label="Run (base)"
            value={run}
            onChange={setRun}
            unit={unit}
            step={sideStep}
            hint="Horizontal leg"
          />
          <NumberField
            id="tri-rise"
            label="Rise (height)"
            value={rise}
            onChange={setRise}
            unit={unit}
            step={sideStep}
            hint="Vertical leg"
          />
          <NumberField
            id="tri-hyp"
            label="Hypotenuse"
            value={hyp}
            onChange={setHyp}
            unit={unit}
            step={sideStep}
            hint="Long side opposite the 90°"
          />
        </div>
        <p className="mb-2 mt-5 text-xs font-semibold uppercase tracking-display text-muted">
          Angles
        </p>
        <div className="grid grid-cols-1 gap-3">
          <NumberField
            id="tri-ang-run"
            label="Angle at the run"
            value={angleRun}
            onChange={setAngleRun}
            unit="°"
            step={0.5}
            hint="Between the run and the hypotenuse"
          />
          <NumberField
            id="tri-ang-rise"
            label="Angle at the rise"
            value={angleRise}
            onChange={setAngleRise}
            unit="°"
            step={0.5}
            hint="Between the rise and the hypotenuse"
          />
          <div className="flex flex-col gap-1.5">
            <p className="text-sm font-medium">Right corner</p>
            <div className="flex h-12 items-center rounded-md border border-border bg-surface-2 px-3">
              <span className="font-display text-lg font-semibold tabular-nums">90</span>
              <span className="ml-2 text-sm text-muted">° locked</span>
            </div>
            <p className="text-xs text-muted">Always the square corner</p>
          </div>
        </div>
        <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Button onClick={calculate} disabled={!dirty}>
            Calculate
          </Button>
          <Button variant="outline" onClick={clear} disabled={!dirty && result == null}>
            Clear
          </Button>
        </div>
        {stale ? (
          <p className="mt-3 text-sm text-muted">
            Inputs changed. Tap Calculate to refresh the drawing.
          </p>
        ) : null}
      </Card>

      <div className="overflow-hidden rounded-xl border border-border bg-surface shadow-sheet">
        <TriangleDiagram result={result} unit={unit} />
      </div>

      {solved ? (
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <Card>
            <p className="text-xs font-medium uppercase tracking-display text-muted">Run</p>
            <p className="mt-1 font-display text-3xl font-semibold tabular-nums">
              {unit === "mm" ? formatMm(result.run) : formatM(result.run)}
              <span className="ml-1 text-lg font-medium text-muted">{unit}</span>
            </p>
          </Card>
          <Card>
            <p className="text-xs font-medium uppercase tracking-display text-muted">Rise</p>
            <p className="mt-1 font-display text-3xl font-semibold tabular-nums">
              {unit === "mm" ? formatMm(result.rise) : formatM(result.rise)}
              <span className="ml-1 text-lg font-medium text-muted">{unit}</span>
            </p>
          </Card>
          <Card>
            <p className="text-xs font-medium uppercase tracking-display text-muted">
              Hypotenuse
            </p>
            <p className="mt-1 font-display text-3xl font-semibold tabular-nums">
              {unit === "mm" ? formatMm(result.hyp) : formatM(result.hyp)}
              <span className="ml-1 text-lg font-medium text-muted">{unit}</span>
            </p>
          </Card>
          <Card>
            <p className="text-xs font-medium uppercase tracking-display text-muted">Pitch</p>
            <p className="mt-1 font-display text-3xl font-semibold tabular-nums">
              {formatDeg(result.pitchDeg)}
              <span className="ml-1 text-lg font-medium text-muted">°</span>
            </p>
            <p className="mt-1 text-sm text-muted">Rise to run {result.riseToRun}</p>
          </Card>
        </div>
      ) : result && !result.ok ? (
        <p className="mt-4 text-sm text-danger">{result.error}</p>
      ) : null}

      {solved ? (
        <Card className="mt-4">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <CardTitle className="mb-0">Set-out</CardTitle>
            {result.is345 ? <Badge variant="ok">3-4-5 square</Badge> : null}
          </div>
          <ul className="flex flex-col gap-1.5 text-sm">
            <li className="flex justify-between gap-3">
              <span className="text-muted">Angle at run</span>
              <span className="tabular-nums">{formatDeg(result.angleRun)}°</span>
            </li>
            <li className="flex justify-between gap-3">
              <span className="text-muted">Angle at rise</span>
              <span className="tabular-nums">{formatDeg(result.angleRise)}°</span>
            </li>
            <li className="flex justify-between gap-3">
              <span className="text-muted">Right corner</span>
              <span className="tabular-nums">90°</span>
            </li>
            <li className="flex justify-between gap-3">
              <span className="text-muted">Hypotenuse</span>
              <span className="tabular-nums">{sideOut(result.hyp, unit)}</span>
            </li>
          </ul>
          {result.warnings.length ? (
            <ul className="mt-3 flex flex-col gap-1 text-sm text-warn">
              {result.warnings.map((w) => (
                <li key={w}>{w}</li>
              ))}
            </ul>
          ) : null}
        </Card>
      ) : null}
    </AppShell>
  );
}

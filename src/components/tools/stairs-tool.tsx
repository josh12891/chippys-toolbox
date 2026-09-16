import { useMemo, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { NumberField, Segmented } from "@/components/fields";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StairDiagram } from "@/components/diagrams";
import { parseNum, formatMm } from "@/lib/format";
import {
  STANDARDS,
  setOutStairs,
  type GoingMode,
  type StairStandardId,
} from "@/lib/stairs";

export function StairsTool() {
  const [height, setHeight] = useState("");
  const [standard, setStandard] = useState<StairStandardId>("ncc");
  const [goingMode, setGoingMode] = useState<GoingMode>("auto");
  const [tread, setTread] = useState("");
  const [overall, setOverall] = useState("");
  const [width, setWidth] = useState("900");

  const result = useMemo(() => {
    const h = parseNum(height);
    if (h == null || h <= 0) return null;
    return setOutStairs({
      totalRiseMm: h,
      standard,
      goingMode,
      treadGoingMm: parseNum(tread) ?? undefined,
      overallGoingMm: parseNum(overall) ?? undefined,
      stairWidthMm: parseNum(width) ?? 900,
    });
  }, [goingMode, height, overall, standard, tread, width]);

  const std = STANDARDS[standard];

  return (
    <AppShell
      title="Stair set-out"
      subtitle="Rise, going and landings against Australian standards."
      back
    >
      <Card className="mb-4">
        <CardHeader>
          <CardTitle>Floor to floor</CardTitle>
          <CardDescription>
            Height is the overall rise. Width can be the stair width, or switch
            going to a manual tread or overall run.
          </CardDescription>
        </CardHeader>
        <div className="flex flex-col gap-4">
          <Segmented
            ariaLabel="Standard"
            value={standard}
            onChange={setStandard}
            options={[
              { value: "ncc", label: "NCC Housing" },
              { value: "as1657", label: "AS 1657" },
            ]}
          />
          <div className="grid gap-3 sm:grid-cols-2">
            <NumberField
              id="rise-total"
              label="Overall height"
              value={height}
              onChange={setHeight}
              unit="mm"
              step={10}
              hint="Finished floor to finished floor"
            />
            <NumberField
              id="stair-w"
              label="Stair width"
              value={width}
              onChange={setWidth}
              unit="mm"
              step={50}
              hint="Across the flight"
            />
          </div>
          <div>
            <p className="mb-1.5 text-sm font-medium">Going / run</p>
            <Segmented
              ariaLabel="Going mode"
              value={goingMode}
              onChange={setGoingMode}
              options={[
                { value: "auto", label: "Auto" },
                { value: "tread", label: "Tread" },
                { value: "overall", label: "Overall run" },
              ]}
            />
          </div>
          {goingMode === "tread" ? (
            <NumberField
              id="tread"
              label="Tread / going length"
              value={tread}
              onChange={setTread}
              unit="mm"
              step={5}
            />
          ) : null}
          {goingMode === "overall" ? (
            <NumberField
              id="overall"
              label="Overall going (total run)"
              value={overall}
              onChange={setOverall}
              unit="mm"
              step={50}
            />
          ) : null}
        </div>
      </Card>

      <div className="overflow-hidden rounded-xl border border-border bg-surface shadow-sheet">
        <StairDiagram result={result} />
      </div>

      {result ? (
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <Card>
            <p className="text-xs font-medium uppercase tracking-display text-muted">
              Rise
            </p>
            <p className="mt-1 font-display text-3xl font-semibold tabular-nums">
              {formatMm(result.riseMm)}
              <span className="ml-1 text-lg font-medium text-muted">mm</span>
            </p>
            <p className="mt-1 text-sm text-muted">
              {result.risers} rises · {formatMm(result.totalRiseMm)} overall
            </p>
          </Card>
          <Card>
            <p className="text-xs font-medium uppercase tracking-display text-muted">
              Going
            </p>
            <p className="mt-1 font-display text-3xl font-semibold tabular-nums">
              {formatMm(result.goingMm)}
              <span className="ml-1 text-lg font-medium text-muted">mm</span>
            </p>
            <p className="mt-1 text-sm text-muted">
              {result.treads} goings · {formatMm(result.overallGoingMm)} overall
            </p>
          </Card>
          <Card>
            <p className="text-xs font-medium uppercase tracking-display text-muted">
              2R + G
            </p>
            <p className="mt-1 font-display text-3xl font-semibold tabular-nums">
              {formatMm(result.slopeMm)}
              <span className="ml-1 text-lg font-medium text-muted">mm</span>
            </p>
            <p className="mt-1 text-sm text-muted">
              Pitch {result.pitchDeg.toFixed(1)}°
            </p>
          </Card>
          <Card>
            <p className="text-xs font-medium uppercase tracking-display text-muted">
              Landing
            </p>
            <p className="mt-1 font-display text-3xl font-semibold tabular-nums">
              {result.landingRequired
                ? `${result.landings}`
                : "None"}
            </p>
            <p className="mt-1 text-sm text-muted">
              Required after {result.maxRisersBeforeLanding} risers in a flight.
              {result.landingRequired
                ? ` Min landing ${result.landingLengthMm} mm.`
                : ` This flight is ${result.risers}.`}
            </p>
          </Card>
        </div>
      ) : null}

      {result?.flights && result.flights.length > 1 ? (
        <Card className="mt-4">
          <CardTitle className="mb-2">Flights</CardTitle>
          <ul className="flex flex-col gap-2 text-sm">
            {result.flights.map((f, i) => (
              <li key={i} className="flex justify-between gap-3 border-b border-border py-2 last:border-0">
                <span className="text-muted">Flight {i + 1}</span>
                <span className="tabular-nums">
                  {f.risers} rises · going {formatMm(f.goingMm)} mm
                </span>
              </li>
            ))}
          </ul>
        </Card>
      ) : null}

      <Card className="mt-4">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <CardTitle className="mb-0">{std.name}</CardTitle>
          {result ? (
            <Badge variant={result.compliant ? "ok" : "danger"}>
              {result.compliant ? "Within limits" : "Outside limits"}
            </Badge>
          ) : null}
        </div>
        <p className="mb-3 text-sm text-muted">{std.short}</p>
        {result ? (
          <ul className="mb-3 flex flex-col gap-2">
            {result.checks.map((c) => (
              <li key={c.label} className="flex items-center justify-between gap-3 text-sm">
                <span className={c.ok ? "text-ink" : "text-danger"}>{c.label}</span>
                <span className="tabular-nums text-muted">{c.detail}</span>
              </li>
            ))}
          </ul>
        ) : null}
        <ul className="flex flex-col gap-1.5 text-sm text-muted">
          {std.notes.map((n) => (
            <li key={n}>— {n}</li>
          ))}
        </ul>
      </Card>
    </AppShell>
  );
}

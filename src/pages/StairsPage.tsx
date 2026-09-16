import { useMemo, useState } from 'react'
import { StairDiagram } from '../components/diagrams/StairDiagram.tsx'
import { DiagramFrame } from '../components/DiagramFrame.tsx'
import { Segmented } from '../components/Segmented.tsx'
import { Stepper } from '../components/Stepper.tsx'
import { ResultStat, ToolHeader } from '../components/ToolHeader.tsx'
import { formatMm, planStair, type GoingMode, type StairCode } from '../lib/stairs.ts'

export function StairsPage() {
  const [code, setCode] = useState<StairCode>('ncc-housing')
  const [height, setHeight] = useState(0)
  const [width, setWidth] = useState(900)
  const [goingMode, setGoingMode] = useState<GoingMode>('auto')
  const [tread, setTread] = useState(250)
  const [overallRun, setOverallRun] = useState(0)

  const result = useMemo(
    () =>
      planStair({
        code,
        overallHeightMm: height,
        stairWidthMm: width,
        goingMode,
        treadMm: tread,
        overallRunMm: overallRun,
      }),
    [code, height, width, goingMode, tread, overallRun],
  )

  return (
    <div className="page pb-12">
      <ToolHeader
        title="Stair set-out"
        subtitle="Rise, going and landings against Australian standards."
      />

      <article className="card px-5 py-5">
        <h2 className="text-[22px] font-semibold">Floor to floor</h2>
        <p className="mt-1 mb-4 text-sm leading-snug text-muted">
          Height is the overall rise. Width can be the stair width, or switch going to manual tread
          or overall run.
        </p>
        <Segmented
          ariaLabel="Stair standard"
          value={code}
          onChange={setCode}
          options={[
            { value: 'ncc-housing', label: 'NCC Housing' },
            { value: 'as1657', label: 'AS 1657' },
          ]}
        />
        <div className="mt-4 grid gap-4">
          <Stepper
            label="Overall height"
            hint="Finished floor to finished floor"
            value={height}
            onChange={setHeight}
            unit="mm"
            step={1}
          />
          <Stepper
            label="Stair width"
            hint="Across the flight"
            value={width}
            onChange={setWidth}
            unit="mm"
            step={1}
          />
        </div>
        <p className="mt-5 mb-2 text-[17px] font-semibold">Going / run</p>
        <Segmented
          ariaLabel="Going mode"
          value={goingMode}
          onChange={setGoingMode}
          options={[
            { value: 'auto', label: 'Auto' },
            { value: 'tread', label: 'Tread' },
            { value: 'overall-run', label: 'Overall run' },
          ]}
        />
        {goingMode === 'tread' ? (
          <div className="mt-4">
            <Stepper label="Tread / going" value={tread} onChange={setTread} unit="mm" step={1} />
          </div>
        ) : null}
        {goingMode === 'overall-run' ? (
          <div className="mt-4">
            <Stepper
              label="Overall run"
              value={overallRun}
              onChange={setOverallRun}
              unit="mm"
              step={1}
            />
          </div>
        ) : null}
      </article>

      <div className="mt-4">
        <DiagramFrame
          kicker="Stair set-out"
          title={result.ready ? `${result.limits.label} check` : 'Enter floor-to-floor height to set out'}
        >
          <StairDiagram result={result} />
        </DiagramFrame>
      </div>

      {result.ready ? (
        <div className="mt-4 grid gap-3">
          <ResultStat
            label="Set-out"
            value={`${result.totalRisers} R · ${formatMm(result.riseMm)} mm`}
            hint={result.notes[0]}
            warn={!result.ok}
          />
          <dl className="card grid grid-cols-2 gap-x-4 gap-y-3 px-5 py-5 text-sm">
            <Stat k="Going" v={`${formatMm(result.goingMm)} mm`} />
            <Stat k="Goings" v={String(result.goingCount)} />
            <Stat k="2R + G" v={`${formatMm(result.twoRG)} mm`} />
            <Stat k="Pitch" v={`${result.pitchDeg.toFixed(1)}°`} />
            <Stat k="Total run" v={`${formatMm(result.totalRunMm, 0)} mm`} />
            <Stat k="Stringer" v={`${formatMm(result.stringerMm, 0)} mm`} />
            <Stat k="Flights" v={String(result.flights.length)} />
            <Stat k="Landings" v={String(result.landingCount)} />
          </dl>
        </div>
      ) : null}

      <p className="mt-6 text-[13px] leading-relaxed text-muted">
        Limits follow NCC 2022 Housing Provisions 11.2 and AS 1657:2018. This is a set-out aid, not
        a certificate. Confirm with the certifier on the job.
      </p>
    </div>
  )
}

function Stat({ k, v }: { k: string; v: string }) {
  return (
    <div>
      <dt className="text-muted">{k}</dt>
      <dd className="text-lg font-semibold">{v}</dd>
    </div>
  )
}

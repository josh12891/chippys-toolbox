import { useMemo, useState } from 'react'
import { TriangleDiagram } from '../components/diagrams/TriangleDiagram.tsx'
import { DiagramFrame } from '../components/DiagramFrame.tsx'
import { Stepper } from '../components/Stepper.tsx'
import { ResultStat, ToolHeader } from '../components/ToolHeader.tsx'
import { solveRightTriangle } from '../lib/triangle.ts'

export function TrianglePage() {
  const [a, setA] = useState(0)
  const [b, setB] = useState(0)
  const [c, setC] = useState(0)
  const [angleA, setAngleA] = useState(0)
  const [angleB, setAngleB] = useState(0)

  const result = useMemo(
    () =>
      solveRightTriangle({
        a: a || null,
        b: b || null,
        c: c || null,
        angleA: angleA || null,
        angleB: angleB || null,
      }),
    [a, b, c, angleA, angleB],
  )

  return (
    <div className="page pb-12">
      <ToolHeader
        title="Triangle calculator"
        subtitle="Right-angle set-out from sides and/or angles."
      />

      <article className="card px-5 py-5">
        <h2 className="text-[22px] font-semibold">Knowns</h2>
        <p className="mt-1 mb-4 text-sm leading-snug text-muted">
          Fill any two sides, or one side and an acute angle. Angle C is 90°.
        </p>
        <div className="grid gap-4">
          <Stepper label="Side a (opposite A)" value={a} onChange={setA} unit="mm" step={1} />
          <Stepper label="Side b (opposite B)" value={b} onChange={setB} unit="mm" step={1} />
          <Stepper label="Hypotenuse c" value={c} onChange={setC} unit="mm" step={1} />
          <Stepper label="Angle A" value={angleA} onChange={setAngleA} unit="°" step={0.5} max={89} />
          <Stepper label="Angle B" value={angleB} onChange={setAngleB} unit="°" step={0.5} max={89} />
        </div>
      </article>

      <div className="mt-4">
        <DiagramFrame kicker="90° set-out" title="Square it from the tape">
          <TriangleDiagram result={result} />
        </DiagramFrame>
      </div>

      {result.ready ? (
        <div className="mt-4 grid gap-3">
          <ResultStat
            label={result.is345 ? '3-4-5' : result.is51213 ? '5-12-13' : 'Right angle'}
            value={`${result.c.toFixed(1)} mm hyp`}
            hint={result.notes[0]}
          />
          <dl className="card grid grid-cols-2 gap-3 px-5 py-5 text-sm">
            <div>
              <dt className="text-muted">a</dt>
              <dd className="text-lg font-semibold">{result.a.toFixed(1)} mm</dd>
            </div>
            <div>
              <dt className="text-muted">b</dt>
              <dd className="text-lg font-semibold">{result.b.toFixed(1)} mm</dd>
            </div>
            <div>
              <dt className="text-muted">Angle A</dt>
              <dd className="text-lg font-semibold">{result.angleA.toFixed(1)}°</dd>
            </div>
            <div>
              <dt className="text-muted">Angle B</dt>
              <dd className="text-lg font-semibold">{result.angleB.toFixed(1)}°</dd>
            </div>
          </dl>
        </div>
      ) : null}
    </div>
  )
}

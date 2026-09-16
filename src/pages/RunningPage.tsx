import { useMemo, useState } from 'react'
import { RunningDiagram } from '../components/diagrams/RunningDiagram.tsx'
import { DiagramFrame } from '../components/DiagramFrame.tsx'
import { Segmented } from '../components/Segmented.tsx'
import { Stepper } from '../components/Stepper.tsx'
import { ToolHeader } from '../components/ToolHeader.tsx'
import { marksSpeech, planRunning, type RunningMode, type SetoutKind } from '../lib/running.ts'
import { canSpeak, isSpeaking, speakMarks, stopSpeech } from '../lib/speech.ts'

export function RunningPage() {
  const [kind, setKind] = useState<SetoutKind>('studs')
  const [mode, setMode] = useState<RunningMode>('count')
  const [overall, setOverall] = useState(0)
  const [width, setWidth] = useState(90)
  const [count, setCount] = useState(5)
  const [spaces, setSpaces] = useState(4)
  const [maxGap, setMaxGap] = useState(450)
  const [playing, setPlaying] = useState(false)

  const result = useMemo(
    () =>
      planRunning({
        kind,
        mode,
        overallMm: overall,
        memberWidthMm: width,
        count,
        spaces,
        maxGapMm: maxGap,
      }),
    [kind, mode, overall, width, count, spaces, maxGap],
  )

  function toggleSpeech() {
    if (playing || isSpeaking()) {
      stopSpeech()
      setPlaying(false)
      return
    }
    if (!canSpeak()) return
    setPlaying(true)
    speakMarks(marksSpeech(result), () => setPlaying(false))
  }

  return (
    <div className="page pb-12">
      <ToolHeader
        title="Running measurements"
        subtitle="Equal centres for frames and balustrades. Play them while you mark."
      />

      <article className="card px-5 py-5">
        <h2 className="text-[22px] font-semibold">Set-out</h2>
        <p className="mt-1 mb-4 text-sm leading-snug text-muted">
          Studs sit on the ends. Balusters sit between posts, equal gaps each side.
        </p>
        <Segmented
          ariaLabel="Member type"
          value={kind}
          onChange={setKind}
          options={[
            { value: 'studs', label: 'Studs / frame' },
            { value: 'balustrade', label: 'Balustrade' },
          ]}
        />
        <div className="mt-4 grid gap-4">
          <Stepper
            label="Overall length"
            value={overall}
            onChange={setOverall}
            unit="mm"
            step={1}
          />
          <Stepper
            label={kind === 'studs' ? 'Stud width' : 'Baluster width'}
            value={width}
            onChange={setWidth}
            unit="mm"
            step={1}
          />
        </div>
        <div className="mt-4">
          <Segmented
            ariaLabel="How to space members"
            value={mode}
            onChange={setMode}
            options={[
              { value: 'count', label: 'Count' },
              { value: 'spaces', label: 'Spaces' },
              { value: 'max-gap', label: 'Max gap' },
            ]}
          />
        </div>
        <div className="mt-4">
          {mode === 'count' ? (
            <Stepper
              label="Number of members"
              value={count}
              onChange={setCount}
              unit=""
              step={1}
              min={kind === 'studs' ? 1 : 0}
            />
          ) : null}
          {mode === 'spaces' ? (
            <Stepper
              label="Number of spaces"
              value={spaces}
              onChange={setSpaces}
              unit=""
              step={1}
              min={1}
            />
          ) : null}
          {mode === 'max-gap' ? (
            <Stepper label="Maximum gap" value={maxGap} onChange={setMaxGap} unit="mm" step={1} />
          ) : null}
        </div>
      </article>

      <div className="mt-4">
        <DiagramFrame kicker="Running marks" title="Play them while you tick the tape">
          <RunningDiagram result={result} overallMm={overall} memberWidthMm={width} />
        </DiagramFrame>
      </div>

      {result.ready ? (
        <div className="card mt-4 px-5 py-5">
          <dl className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <dt className="text-muted">Members</dt>
              <dd className="text-lg font-semibold">{result.memberCount}</dd>
            </div>
            <div>
              <dt className="text-muted">Spaces</dt>
              <dd className="text-lg font-semibold">{result.spaceCount}</dd>
            </div>
            <div>
              <dt className="text-muted">Gap</dt>
              <dd className="text-lg font-semibold">{result.gapMm} mm</dd>
            </div>
            <div>
              <dt className="text-muted">Centres</dt>
              <dd className="text-lg font-semibold">{result.centreSpacingMm} mm</dd>
            </div>
          </dl>
          <ol className="mt-4 grid gap-1 text-sm">
            {result.marksMm.map((mark, i) => (
              <li key={`${mark}-${i}`} className="flex justify-between border-b border-line py-1">
                <span className="text-muted">Mark {i + 1}</span>
                <span className="font-semibold">{mark} mm</span>
              </li>
            ))}
          </ol>
          <button
            type="button"
            className="mt-5 w-full rounded-full bg-primary py-4 text-[16px] font-semibold text-primary-ink"
            onClick={toggleSpeech}
            disabled={!canSpeak() && !playing}
          >
            {playing ? 'Stop' : 'Play'}
          </button>
          <p className="mt-2 text-center text-sm text-muted">Speech read-out in Australian English.</p>
        </div>
      ) : null}
    </div>
  )
}

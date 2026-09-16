import type { StairResult } from '../../lib/stairs.ts'

export function StairDiagram({ result }: { result: StairResult }) {
  const risers = result.ready ? Math.min(result.flights[0]?.risers ?? 8, 12) : 8
  const going = 18
  const rise = 14
  const startX = 36
  const startY = 168
  const bits = [`M ${startX} ${startY}`]
  for (let i = 0; i < risers; i += 1) {
    bits.push(`v -${rise} h ${going}`)
  }
  bits.push(`v ${risers * rise}`)
  const path = bits.join(' ')

  return (
    <svg viewBox="0 0 360 200" className="h-auto w-full" role="img" aria-label="Stair set-out">
      <rect x="0" y="0" width="360" height="200" rx="22" fill="#f3eee6" />
      <text x="24" y="28" fill="#8a837a" fontSize="11" fontWeight="700" letterSpacing="1.8">
        STAIR SET-OUT
      </text>
      <text x="24" y="48" fill="#6d675f" fontSize="13">
        {result.ready
          ? `${result.totalRisers} risers · ${result.goingCount} goings`
          : 'Enter floor-to-floor height to set out'}
      </text>
      <path d={path} fill="none" stroke="#1a1714" strokeWidth="2.4" />
      {result.ready ? (
        <>
          <text x="24" y="188" fill="#1a1714" fontSize="12" fontWeight="600">
            R {result.riseMm.toFixed(1)} · G {result.goingMm.toFixed(0)}
          </text>
          <text x="336" y="188" textAnchor="end" fill="#1a1714" fontSize="12" fontWeight="600">
            {result.pitchDeg.toFixed(1)}°
          </text>
        </>
      ) : null}
    </svg>
  )
}

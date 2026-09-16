import type { RunningResult } from '../../lib/running.ts'

export function RunningDiagram({
  result,
  overallMm,
  memberWidthMm,
}: {
  result: RunningResult
  overallMm: number
  memberWidthMm: number
}) {
  const width = 312
  const x0 = 24
  const y = 92
  const marks = result.ready ? result.startsMm : []
  const scale = overallMm > 0 ? width / overallMm : 0

  return (
    <svg viewBox="0 0 360 200" className="h-auto w-full" role="img" aria-label="Running marks">
      <rect x="0" y="0" width="360" height="200" rx="22" fill="#f3eee6" />
      <text x="24" y="28" fill="#8a837a" fontSize="11" fontWeight="700" letterSpacing="1.8">
        RUNNING MARKS
      </text>
      <text x="24" y="48" fill="#6d675f" fontSize="13">
        {result.ready
          ? `${result.memberCount} members · ${result.gapMm} mm gaps`
          : 'Enter overall length and member width'}
      </text>
      <rect x={x0} y={y} width={width} height="16" rx="4" fill="#2f4a3c" />
      {marks.map((mark, i) => {
        const x = x0 + mark * scale
        const w = Math.max(3, memberWidthMm * scale)
        return (
          <g key={`${mark}-${i}`}>
            <rect x={x} y={y - 18} width={w} height="52" fill="#1a1714" opacity="0.9" />
          </g>
        )
      })}
      <text x="24" y="176" fill="#1a1714" fontSize="12" fontWeight="600">
        {result.ready ? `centres ${result.centreSpacingMm} mm` : '0'}
      </text>
    </svg>
  )
}

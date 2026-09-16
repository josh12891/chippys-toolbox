import type { TriangleSolve } from '../../lib/triangle.ts'

export function TriangleDiagram({ result }: { result: TriangleSolve }) {
  return (
    <svg viewBox="0 0 360 220" className="h-auto w-full" role="img" aria-label="Right-angle triangle">
      <rect x="0" y="0" width="360" height="220" rx="22" fill="#f3eee6" />
      <text x="24" y="28" fill="#8a837a" fontSize="11" fontWeight="700" letterSpacing="1.8">
        90° SET-OUT
      </text>
      <path d="M64 176 L64 64 L268 176 Z" fill="#d9cbb8" stroke="#1a1714" strokeWidth="2.4" />
      <path d="M64 152 h24 v24" fill="none" stroke="#1a1714" strokeWidth="2" />
      <text x="46" y="120" fill="#1a1714" fontSize="13" fontWeight="700">
        a
      </text>
      <text x="150" y="198" fill="#1a1714" fontSize="13" fontWeight="700">
        b
      </text>
      <text x="180" y="108" fill="#1a1714" fontSize="13" fontWeight="700">
        c
      </text>
      {result.ready ? (
        <text x="24" y="208" fill="#1a1714" fontSize="12" fontWeight="600">
          {result.is345 ? '3-4-5' : result.is51213 ? '5-12-13' : `${result.angleA.toFixed(1)}° / ${result.angleB.toFixed(1)}°`}
        </text>
      ) : (
        <text x="24" y="208" fill="#6d675f" fontSize="12">
          Sides a, b and hypotenuse c
        </text>
      )}
    </svg>
  )
}

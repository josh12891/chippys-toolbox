type SlabDims = { height: number; width: number; depth: number; unit: string }

export function SlabDiagram({ dims, label }: { dims: SlabDims; label: string }) {
  const ready = dims.height > 0 && dims.width > 0 && dims.depth > 0
  return (
    <svg viewBox="0 0 360 200" className="h-auto w-full" role="img" aria-label={label}>
      <rect x="0" y="0" width="360" height="200" rx="22" fill="#f3eee6" />
      <text x="24" y="28" fill="#8a837a" fontSize="11" fontWeight="700" letterSpacing="1.8">
        {label.toUpperCase()}
      </text>
      <g transform="translate(70 48)">
        <polygon points="40,70 180,70 230,28 90,28" fill="#d9cbb8" />
        <polygon points="40,70 90,28 90,8 40,50" fill="#c3b49d" />
        <polygon points="40,70 180,70 180,90 40,90" fill="#b39f84" />
        <polygon points="180,70 230,28 230,48 180,90" fill="#9f8b70" />
        {ready ? (
          <>
            <text x="110" y="108" textAnchor="middle" fill="#1a1714" fontSize="13" fontWeight="700">
              {dims.width} × {dims.depth} {dims.unit}
            </text>
            <text x="18" y="72" fill="#1a1714" fontSize="12" fontWeight="600">
              {dims.height}
            </text>
          </>
        ) : (
          <text x="130" y="118" textAnchor="middle" fill="#6d675f" fontSize="13">
            Enter height, width and depth
          </text>
        )}
      </g>
    </svg>
  )
}

export function FootingDiagram({ dims, label }: { dims: SlabDims; label: string }) {
  return (
    <svg viewBox="0 0 360 200" className="h-auto w-full" role="img" aria-label={label}>
      <rect x="0" y="0" width="360" height="200" rx="22" fill="#f3eee6" />
      <text x="24" y="28" fill="#8a837a" fontSize="11" fontWeight="700" letterSpacing="1.8">
        {label.toUpperCase()}
      </text>
      <rect x="36" y="70" width="288" height="70" rx="8" fill="#c3b49d" />
      <rect x="36" y="70" width="288" height="22" rx="8" fill="#d9cbb8" />
      <text x="180" y="112" textAnchor="middle" fill="#1a1714" fontSize="13" fontWeight="700">
        {dims.width > 0 ? `${dims.width} ${dims.unit} wide` : 'Strip footing'}
      </text>
    </svg>
  )
}

export function PierDiagram({
  round,
  size,
  height,
  unit,
  label,
}: {
  round: boolean
  size: number
  height: number
  unit: string
  label: string
}) {
  return (
    <svg viewBox="0 0 360 200" className="h-auto w-full" role="img" aria-label={label}>
      <rect x="0" y="0" width="360" height="200" rx="22" fill="#f3eee6" />
      <text x="24" y="28" fill="#8a837a" fontSize="11" fontWeight="700" letterSpacing="1.8">
        {label.toUpperCase()}
      </text>
      {round ? (
        <>
          <ellipse cx="180" cy="58" rx="54" ry="18" fill="#d9cbb8" />
          <rect x="126" y="58" width="108" height="90" fill="#c3b49d" />
          <ellipse cx="180" cy="148" rx="54" ry="18" fill="#b39f84" />
        </>
      ) : (
        <>
          <rect x="130" y="48" width="100" height="110" fill="#c3b49d" />
          <polygon points="130,48 170,28 270,28 230,48" fill="#d9cbb8" />
        </>
      )}
      <text x="180" y="188" textAnchor="middle" fill="#1a1714" fontSize="13" fontWeight="700">
        {size > 0 && height > 0
          ? `${round ? 'Ø' : ''}${size} × ${height} ${unit}`
          : round
            ? 'Round pier'
            : 'Square pier'}
      </text>
    </svg>
  )
}

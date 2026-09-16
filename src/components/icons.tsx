type IconProps = { size?: number }

export function ConcreteIcon({ size = 28 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <rect x="6" y="7" width="20" height="6" rx="1.5" fill="currentColor" />
      <rect x="8" y="14" width="16" height="5" rx="1.4" fill="currentColor" opacity="0.85" />
      <rect x="10" y="20" width="12" height="5" rx="1.3" fill="currentColor" opacity="0.7" />
    </svg>
  )
}

export function StairIcon({ size = 28 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <path
        d="M7 25h6v-5h5v-5h5V10h5"
        stroke="currentColor"
        strokeWidth="2.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function RulerIcon({ size = 28 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <rect x="6" y="13" width="20" height="6" rx="1.5" stroke="currentColor" strokeWidth="2" />
      <path d="M10 13v4M14 13v3M18 13v4M22 13v3" stroke="currentColor" strokeWidth="1.7" />
    </svg>
  )
}

export function TriangleIcon({ size = 28 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <path d="M7 24h18L7 8v16z" stroke="currentColor" strokeWidth="2.2" strokeLinejoin="round" />
      <path d="M10 21h6v-6" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  )
}

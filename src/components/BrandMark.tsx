type BrandMarkProps = {
  size?: number
}

export function BrandMark({ size = 52 }: BrandMarkProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      aria-hidden="true"
      className="overflow-visible"
    >
      <rect width="64" height="64" rx="16" fill="#2f4a3c" />
      <path d="M16 16h10v28h22v10H16V16zm16 6h16v8H32V22z" fill="#faf7f2" />
    </svg>
  )
}

import { Link } from 'react-router'

type ToolHeaderProps = {
  title: string
  subtitle: string
}

export function ToolHeader({ title, subtitle }: ToolHeaderProps) {
  return (
    <header className="mb-5 flex items-start gap-3">
      <Link to="/" className="back-btn mt-1" aria-label="Back to tools">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M15 5 8 12l7 7"
            stroke="currentColor"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </Link>
      <div className="min-w-0 pt-1">
        <p className="kicker">The Chippy's Toolbox</p>
        <h1 className="display mt-1 text-[40px] text-ink">{title}</h1>
        <p className="mt-2 text-[16px] leading-snug text-muted">{subtitle}</p>
      </div>
    </header>
  )
}

export function ResultStat({
  label,
  value,
  hint,
  warn,
}: {
  label: string
  value: string
  hint?: string
  warn?: boolean
}) {
  return (
    <div className="rounded-[22px] bg-primary px-5 py-5 text-primary-ink">
      <p className="text-[11px] font-semibold tracking-[0.16em] uppercase opacity-80">{label}</p>
      <p className="display mt-1 text-[42px]">{value}</p>
      {hint ? (
        <p className={`mt-2 text-sm ${warn ? 'text-[#f3d2b3]' : 'opacity-80'}`}>{hint}</p>
      ) : null}
    </div>
  )
}

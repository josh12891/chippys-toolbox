import { Link } from 'react-router'
import { BrandMark } from '../components/BrandMark.tsx'
import { ConcreteIcon, RulerIcon, StairIcon, TriangleIcon } from '../components/icons.tsx'
import type { ReactNode } from 'react'

const tools = [
  {
    to: '/concrete',
    n: '01',
    title: 'Concrete volume',
    copy: 'Slabs, strip footings and piers. Height, width, depth — answer in m³ with a drawing.',
    icon: <ConcreteIcon />,
  },
  {
    to: '/stairs',
    n: '02',
    title: 'Stair set-out',
    copy: 'Rise, going and landings to NCC Housing and AS 1657. Max 18 risers before a landing.',
    icon: <StairIcon />,
  },
  {
    to: '/running',
    n: '03',
    title: 'Running measurements',
    copy: 'Equal centres for frames and balustrades. Play the marks while you tick the tape.',
    icon: <RulerIcon />,
  },
  {
    to: '/triangle',
    n: '04',
    title: 'Triangle calculator',
    copy: 'Right-angle set-out from sides and/or angles. 3-4-5 called out when it fits.',
    icon: <TriangleIcon />,
  },
] as const

export function HomePage() {
  return (
    <div className="page pb-10">
      <div className="flex items-center gap-3">
        <BrandMark size={52} />
        <p className="kicker">On-site set-out</p>
      </div>

      <h1 className="display mt-6 text-[52px] text-ink">The Chippy's Toolbox</h1>
      <p className="mt-4 max-w-[22rem] text-[17px] leading-snug text-muted">
        Concrete, stairs, running measurements and a 90° triangle — built for the tape, not the
        office.
      </p>

      <div className="mt-8 grid gap-3">
        {tools.map((tool) => (
          <ToolCard key={tool.to} {...tool} />
        ))}
      </div>

      <p className="mt-8 text-[13px] leading-relaxed text-muted">
        Stair limits follow NCC 2022 Housing Provisions 11.2 and AS 1657:2018. Confirm with the
        certifier on the job.
      </p>
      <p className="mt-3 flex gap-4 text-sm font-semibold">
        <Link to="/about" className="text-primary underline-offset-2 hover:underline">
          About
        </Link>
        <Link to="/privacy" className="text-primary underline-offset-2 hover:underline">
          Privacy
        </Link>
      </p>
    </div>
  )
}

function ToolCard({
  to,
  n,
  title,
  copy,
  icon,
}: {
  to: string
  n: string
  title: string
  copy: string
  icon: ReactNode
}) {
  return (
    <Link to={to} className="card flex items-center gap-4 px-4 py-4">
      <span className="icon-tile">{icon}</span>
      <span className="min-w-0 flex-1">
        <span className="block text-[12px] font-semibold tracking-[0.08em] text-muted">{n}</span>
        <span className="block text-[20px] font-semibold leading-tight">{title}</span>
        <span className="mt-1 block text-[14px] leading-snug text-muted">{copy}</span>
      </span>
      <span className="text-2xl text-muted" aria-hidden="true">
        →
      </span>
    </Link>
  )
}

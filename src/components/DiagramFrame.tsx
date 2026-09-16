import type { ReactNode } from 'react'
import { BrandMark } from './BrandMark.tsx'

export function DiagramFrame({
  kicker,
  title,
  children,
}: {
  kicker: string
  title: string
  children: ReactNode
}) {
  return (
    <section className="card overflow-hidden">
      <div className="flex items-start justify-between px-5 pt-5">
        <div>
          <p className="kicker">{kicker}</p>
          <p className="mt-1 text-sm text-muted">{title}</p>
        </div>
        <BrandMark size={36} />
      </div>
      <div className="px-3 pb-4 pt-2">{children}</div>
    </section>
  )
}

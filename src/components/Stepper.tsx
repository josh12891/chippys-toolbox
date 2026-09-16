import { useEffect, useRef, type PointerEvent } from 'react'

type StepperProps = {
  label: string
  hint?: string
  value: number
  onChange: (value: number) => void
  unit: string
  step: number
  min?: number
  max?: number
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

export function Stepper({
  label,
  hint,
  value,
  onChange,
  unit,
  step,
  min = 0,
  max = 1_000_000,
}: StepperProps) {
  const holdRef = useRef<number | null>(null)
  const display = Number.isFinite(value) ? String(value) : ''

  useEffect(() => {
    return () => {
      if (holdRef.current) window.clearInterval(holdRef.current)
    }
  }, [])

  function nudge(direction: 1 | -1) {
    const next = clamp(Number((value + direction * step).toFixed(4)), min, max)
    onChange(next)
  }

  function startHold(direction: 1 | -1, event: PointerEvent<HTMLButtonElement>) {
    event.preventDefault()
    nudge(direction)
    if (holdRef.current) window.clearInterval(holdRef.current)
    holdRef.current = window.setInterval(() => nudge(direction), 90)
  }

  function stopHold() {
    if (holdRef.current) {
      window.clearInterval(holdRef.current)
      holdRef.current = null
    }
  }

  return (
    <label className="block">
      <span className="mb-2 block text-[17px] font-semibold">{label}</span>
      <div className="flex items-center gap-2">
        <button
          type="button"
          className="stepper-btn"
          aria-label={`Decrease ${label}`}
          onPointerDown={(e) => startHold(-1, e)}
          onPointerUp={stopHold}
          onPointerCancel={stopHold}
          onPointerLeave={stopHold}
        >
          −
        </button>
        <div className="stepper-field">
          <input
            inputMode="decimal"
            value={display}
            aria-label={label}
            onChange={(e) => {
              const raw = e.target.value
              if (raw === '') {
                onChange(0)
                return
              }
              const parsed = Number(raw)
              if (Number.isFinite(parsed)) onChange(clamp(parsed, min, max))
            }}
          />
          <span className="unit">{unit}</span>
        </div>
        <button
          type="button"
          className="stepper-btn"
          aria-label={`Increase ${label}`}
          onPointerDown={(e) => startHold(1, e)}
          onPointerUp={stopHold}
          onPointerCancel={stopHold}
          onPointerLeave={stopHold}
        >
          +
        </button>
      </div>
      {hint ? <span className="mt-1.5 block text-sm text-muted">{hint}</span> : null}
    </label>
  )
}

type Option<T extends string> = { value: T; label: string }

type SegmentedProps<T extends string> = {
  value: T
  options: Option<T>[]
  onChange: (value: T) => void
  ariaLabel: string
}

export function Segmented<T extends string>({
  value,
  options,
  onChange,
  ariaLabel,
}: SegmentedProps<T>) {
  return (
    <div className="seg-track" role="tablist" aria-label={ariaLabel}>
      {options.map((option) => {
        const on = option.value === value
        return (
          <button
            key={option.value}
            type="button"
            role="tab"
            aria-selected={on}
            className={on ? 'seg-btn on' : 'seg-btn'}
            onClick={() => onChange(option.value)}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}

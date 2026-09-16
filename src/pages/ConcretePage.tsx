import { useMemo, useState } from 'react'
import {
  FootingDiagram,
  PierDiagram,
  SlabDiagram,
} from '../components/diagrams/ConcreteDiagrams.tsx'
import { DiagramFrame } from '../components/DiagramFrame.tsx'
import { Segmented } from '../components/Segmented.tsx'
import { Stepper } from '../components/Stepper.tsx'
import { ResultStat, ToolHeader } from '../components/ToolHeader.tsx'
import {
  convertLength,
  cylinderVolumeM3,
  formatM3,
  rectVolumeM3,
  roundUpOrderQty,
  type LengthUnit,
} from '../lib/concrete.ts'

type Kind = 'slabs' | 'footings' | 'piers'
type Shape = 'round' | 'square'

type RectItem = { id: string; height: number; width: number; depth: number }
type PierItem = { id: string; shape: Shape; size: number; height: number }

let seq = 1
function nid(): string {
  seq += 1
  return `n${seq}`
}

export function ConcretePage() {
  const [unit, setUnit] = useState<LengthUnit>('mm')
  const [kind, setKind] = useState<Kind>('slabs')
  const [slabs, setSlabs] = useState<RectItem[]>([{ id: 's1', height: 0, width: 0, depth: 0 }])
  const [footings, setFootings] = useState<RectItem[]>([
    { id: 'f1', height: 0, width: 0, depth: 0 },
  ])
  const [piers, setPiers] = useState<PierItem[]>([
    { id: 'p1', shape: 'round', size: 0, height: 0 },
  ])

  const step = unit === 'mm' ? 1 : 0.001

  function switchUnit(next: LengthUnit) {
    if (next === unit) return
    const conv = (n: number) => convertLength(n, unit, next)
    setSlabs((items) =>
      items.map((item) => ({
        ...item,
        height: conv(item.height),
        width: conv(item.width),
        depth: conv(item.depth),
      })),
    )
    setFootings((items) =>
      items.map((item) => ({
        ...item,
        height: conv(item.height),
        width: conv(item.width),
        depth: conv(item.depth),
      })),
    )
    setPiers((items) =>
      items.map((item) => ({
        ...item,
        size: conv(item.size),
        height: conv(item.height),
      })),
    )
    setUnit(next)
  }

  const totals = useMemo(() => {
    const slabVol = slabs.reduce(
      (sum, item) => sum + rectVolumeM3(item.height, item.width, item.depth, unit),
      0,
    )
    const footingVol = footings.reduce(
      (sum, item) => sum + rectVolumeM3(item.height, item.width, item.depth, unit),
      0,
    )
    const pierVol = piers.reduce((sum, item) => {
      if (item.shape === 'round') return sum + cylinderVolumeM3(item.size, item.height, unit)
      return sum + rectVolumeM3(item.height, item.size, item.size, unit)
    }, 0)
    const job = slabVol + footingVol + pierVol
    return { slabVol, footingVol, pierVol, job, order: roundUpOrderQty(job) }
  }, [slabs, footings, piers, unit])

  const activeRects = kind === 'slabs' ? slabs : footings
  const setRects = kind === 'slabs' ? setSlabs : setFootings

  return (
    <div className="page pb-40">
      <ToolHeader
        title="Concrete volume"
        subtitle="Slabs, strip footings and piers. Answer in cubic metres."
      />

      <div className="grid gap-3">
        <Segmented
          ariaLabel="Length unit"
          value={unit}
          onChange={switchUnit}
          options={[
            { value: 'mm', label: 'mm' },
            { value: 'm', label: 'm' },
          ]}
        />
        <Segmented
          ariaLabel="Concrete element"
          value={kind}
          onChange={setKind}
          options={[
            { value: 'slabs', label: 'Slabs' },
            { value: 'footings', label: 'Footings' },
            { value: 'piers', label: 'Piers' },
          ]}
        />
      </div>

      {kind !== 'piers'
        ? activeRects.map((item, index) => (
            <article key={item.id} className="card mt-4 px-5 py-5">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-[22px] font-semibold">
                  {kind === 'slabs' ? 'Slab' : 'Footing'} {index + 1}
                </h2>
                {activeRects.length > 1 ? (
                  <button
                    type="button"
                    className="text-sm font-semibold text-muted"
                    onClick={() => setRects(activeRects.filter((row) => row.id !== item.id))}
                  >
                    Remove
                  </button>
                ) : null}
              </div>
              <div className="grid gap-4">
                <Stepper
                  label={kind === 'slabs' ? 'Height / thickness' : 'Depth'}
                  value={item.height}
                  onChange={(height) =>
                    setRects(activeRects.map((row) => (row.id === item.id ? { ...row, height } : row)))
                  }
                  unit={unit}
                  step={step}
                />
                <Stepper
                  label="Width"
                  value={item.width}
                  onChange={(width) =>
                    setRects(activeRects.map((row) => (row.id === item.id ? { ...row, width } : row)))
                  }
                  unit={unit}
                  step={step}
                />
                <Stepper
                  label={kind === 'slabs' ? 'Depth / length' : 'Length'}
                  value={item.depth}
                  onChange={(depth) =>
                    setRects(activeRects.map((row) => (row.id === item.id ? { ...row, depth } : row)))
                  }
                  unit={unit}
                  step={step}
                />
              </div>
              <div className="mt-5">
                {kind === 'slabs' ? (
                  <SlabDiagram
                    label={`${kind === 'slabs' ? 'Slab' : 'Footing'} ${index + 1}`}
                    dims={{ ...item, unit }}
                  />
                ) : (
                  <FootingDiagram label={`Footing ${index + 1}`} dims={{ ...item, unit }} />
                )}
              </div>
              <p className="mt-3 text-sm text-muted">
                This item {formatM3(rectVolumeM3(item.height, item.width, item.depth, unit))} m³
              </p>
            </article>
          ))
        : piers.map((item, index) => (
            <article key={item.id} className="card mt-4 px-5 py-5">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-[22px] font-semibold">Pier {index + 1}</h2>
                {piers.length > 1 ? (
                  <button
                    type="button"
                    className="text-sm font-semibold text-muted"
                    onClick={() => setPiers(piers.filter((row) => row.id !== item.id))}
                  >
                    Remove
                  </button>
                ) : null}
              </div>
              <Segmented
                ariaLabel="Pier shape"
                value={item.shape}
                onChange={(shape) =>
                  setPiers(piers.map((row) => (row.id === item.id ? { ...row, shape } : row)))
                }
                options={[
                  { value: 'round', label: 'Round' },
                  { value: 'square', label: 'Square' },
                ]}
              />
              <div className="mt-4 grid gap-4">
                <Stepper
                  label={item.shape === 'round' ? 'Diameter' : 'Width'}
                  value={item.size}
                  onChange={(size) =>
                    setPiers(piers.map((row) => (row.id === item.id ? { ...row, size } : row)))
                  }
                  unit={unit}
                  step={step}
                />
                <Stepper
                  label="Height"
                  value={item.height}
                  onChange={(height) =>
                    setPiers(piers.map((row) => (row.id === item.id ? { ...row, height } : row)))
                  }
                  unit={unit}
                  step={step}
                />
              </div>
              <div className="mt-5">
                <PierDiagram
                  label={`Pier ${index + 1}`}
                  round={item.shape === 'round'}
                  size={item.size}
                  height={item.height}
                  unit={unit}
                />
              </div>
            </article>
          ))}

      <button
        type="button"
        className="mt-4 w-full rounded-full bg-primary py-4 text-[16px] font-semibold text-primary-ink"
        onClick={() => {
          if (kind === 'piers') {
            setPiers([...piers, { id: nid(), shape: 'round', size: 0, height: 0 }])
          } else {
            setRects([...activeRects, { id: nid(), height: 0, width: 0, depth: 0 }])
          }
        }}
      >
        Add {kind === 'slabs' ? 'slab' : kind === 'footings' ? 'footing' : 'pier'}
      </button>

      <DiagramFrame kicker="Job mix" title="Slabs, footings and piers on one ticket">
        <div className="grid grid-cols-3 gap-2 px-2 pb-2 text-center text-sm">
          <div className="rounded-2xl bg-[#f3eee6] px-2 py-3">
            <div className="text-muted">Slabs</div>
            <div className="font-semibold">{formatM3(totals.slabVol)}</div>
          </div>
          <div className="rounded-2xl bg-[#f3eee6] px-2 py-3">
            <div className="text-muted">Footings</div>
            <div className="font-semibold">{formatM3(totals.footingVol)}</div>
          </div>
          <div className="rounded-2xl bg-[#f3eee6] px-2 py-3">
            <div className="text-muted">Piers</div>
            <div className="font-semibold">{formatM3(totals.pierVol)}</div>
          </div>
        </div>
      </DiagramFrame>

      <div className="fixed right-0 bottom-0 left-0 px-4 pb-[max(16px,env(safe-area-inset-bottom))] pt-2">
        <div className="mx-auto w-full max-w-[430px]">
          <ResultStat
            label="Job total"
            value={`${formatM3(totals.job)} m³`}
            hint={`Order ${formatM3(totals.order)} m³ (rounded up to 0.2). Enter sizes to tally slabs, footings and piers.`}
          />
        </div>
      </div>
    </div>
  )
}

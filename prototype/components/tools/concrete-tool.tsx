import { useMemo, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { NumberField, Segmented } from "@/components/fields";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FootingDiagram, PierDiagram, SlabDiagram, VolumeBanner } from "@/components/diagrams";
import {
  onePierVolumeM3,
  pierVolumeM3,
  slabVolumeM3,
  stripVolumeM3,
  sumVolumes,
  type SlabInput,
} from "@/lib/concrete";
import {
  formatM3,
  parseNum,
  roundM3Order,
  toMetres,
  type LengthUnit,
} from "@/lib/format";

const emptySlab = (enabled: boolean): SlabInput => ({
  enabled,
  height: "",
  width: "",
  depth: "",
});

function SlabFields({
  index,
  slab,
  unit,
  onChange,
  onRemove,
}: {
  index: number;
  slab: SlabInput;
  unit: LengthUnit;
  onChange: (s: SlabInput) => void;
  onRemove?: () => void;
}) {
  const set = (key: keyof SlabInput, v: string) => onChange({ ...slab, [key]: v });
  const vol = slabVolumeM3(slab, unit);
  return (
    <Card className="p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h3 className="font-display text-lg font-semibold">Slab {index}</h3>
        {onRemove ? (
          <Button variant="ghost" size="sm" onClick={onRemove}>
            <Trash2 className="size-4" />
            Remove
          </Button>
        ) : null}
      </div>
      <div className="grid grid-cols-1 gap-3">
        <NumberField
          id={`s${index}-h`}
          label="Height / thickness"
          value={slab.height}
          onChange={(v) => set("height", v)}
          unit={unit}
          step={unit === "mm" ? 10 : 0.01}
        />
        <NumberField
          id={`s${index}-w`}
          label="Width"
          value={slab.width}
          onChange={(v) => set("width", v)}
          unit={unit}
          step={unit === "mm" ? 100 : 0.1}
        />
        <NumberField
          id={`s${index}-d`}
          label="Depth / length"
          value={slab.depth}
          onChange={(v) => set("depth", v)}
          unit={unit}
          step={unit === "mm" ? 100 : 0.1}
        />
      </div>
      <div className="mt-4 overflow-hidden rounded-lg">
        <SlabDiagram
          title={`Slab ${index}`}
          height={parseNum(slab.height)}
          width={parseNum(slab.width)}
          depth={parseNum(slab.depth)}
          unit={unit}
        />
        <VolumeBanner caption="Slab volume" volume={vol} />
      </div>
    </Card>
  );
}

export function ConcreteTool() {
  const [unit, setUnit] = useState<LengthUnit>("mm");
  const [tab, setTab] = useState<"slabs" | "footings" | "piers">("slabs");
  const [slabs, setSlabs] = useState<SlabInput[]>([emptySlab(true)]);
  const [fh, setFh] = useState("");
  const [fw, setFw] = useState("");
  const [fl, setFl] = useState("");
  const [dia, setDia] = useState("300");
  const [depths, setDepths] = useState<string[]>([]);
  const [qty, setQty] = useState("1");
  const [qtyDepth, setQtyDepth] = useState("");

  const slabVols = slabs.map((s) => slabVolumeM3(s, unit));
  const footingVol = stripVolumeM3({ height: fh, width: fw, linealM: fl, unit });
  const piers = pierVolumeM3({ diameter: dia, unit, depthsM: depths });
  const total = sumVolumes([...slabVols, footingVol, piers?.volumeM3]);

  const diaPresets = unit === "mm" ? [250, 300, 350, 400, 450, 500, 600] : [0.25, 0.3, 0.35, 0.4, 0.45, 0.5, 0.6];

  const addPiersFromQty = () => {
    const n = Math.max(1, Math.round(parseNum(qty) ?? 1));
    const d = parseNum(qtyDepth);
    if (d == null || d <= 0) return;
    const add = Array.from({ length: n }, () => String(d));
    setDepths((prev) => {
      const filled = prev.filter((x) => x.trim() !== "");
      return [...filled, ...add];
    });
  };

  const filledPiers = depths
    .map((d, i) => ({ i, depth: parseNum(d) }))
    .filter((p): p is { i: number; depth: number } => p.depth != null && p.depth > 0);
  const diaN = parseNum(dia);
  const diaM = diaN != null && diaN > 0 ? toMetres(diaN, unit) : 0.3;
  const scaleDiaM = Math.max(0.6, diaM);
  const scaleDepthM = Math.max(1.8, ...filledPiers.map((p) => p.depth));

  const jobBits = useMemo(() => {
    const bits: string[] = [];
    slabVols.forEach((v, i) => {
      if (v) bits.push(`Slab ${i + 1} ${formatM3(v)}`);
    });
    if (footingVol) bits.push(`Footings ${formatM3(footingVol)}`);
    if (piers) bits.push(`Piers ${formatM3(piers.volumeM3)}`);
    return bits;
  }, [footingVol, piers, slabVols]);

  return (
    <AppShell
      title="Concrete volume"
      subtitle="Slabs, strip footings and piers. Answer in cubic metres."
      back
    >
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Segmented
          ariaLabel="Length unit"
          value={unit}
          onChange={setUnit}
          options={[
            { value: "mm", label: "mm" },
            { value: "m", label: "m" },
          ]}
        />
        <Segmented
          ariaLabel="Concrete element"
          value={tab}
          onChange={setTab}
          options={[
            { value: "slabs", label: "Slabs" },
            { value: "footings", label: "Footings" },
            { value: "piers", label: "Piers" },
          ]}
        />
      </div>

      {tab === "slabs" ? (
        <div className="flex flex-col gap-4">
          {slabs.map((slab, i) => (
            <SlabFields
              key={i}
              index={i + 1}
              slab={slab}
              unit={unit}
              onChange={(s) =>
                setSlabs((prev) => prev.map((p, idx) => (idx === i ? s : p)))
              }
              onRemove={
                i > 0
                  ? () => setSlabs((prev) => prev.filter((_, idx) => idx !== i))
                  : undefined
              }
            />
          ))}
          {slabs.length < 3 ? (
            <Button
              variant="outline"
              onClick={() => setSlabs((prev) => [...prev, emptySlab(true)])}
            >
              <Plus className="size-4" />
              Add slab {slabs.length + 1}
            </Button>
          ) : null}
        </div>
      ) : null}

      {tab === "footings" ? (
        <Card>
          <CardHeader>
            <CardTitle>Strip footings</CardTitle>
            <CardDescription>
              Height and width of the trench, then lineal metres of run.
            </CardDescription>
          </CardHeader>
          <div className="grid grid-cols-1 gap-3">
            <NumberField
              id="fh"
              label="Height"
              value={fh}
              onChange={setFh}
              unit={unit}
              step={unit === "mm" ? 50 : 0.05}
            />
            <NumberField
              id="fw"
              label="Width"
              value={fw}
              onChange={setFw}
              unit={unit}
              step={unit === "mm" ? 50 : 0.05}
            />
            <NumberField
              id="fl"
              label="Lineal metres"
              value={fl}
              onChange={setFl}
              unit="m"
              step={0.5}
            />
          </div>
          <div className="mt-4 overflow-hidden rounded-lg">
            <FootingDiagram
              height={parseNum(fh)}
              width={parseNum(fw)}
              linealM={parseNum(fl)}
              unit={unit}
            />
            <VolumeBanner caption="Footing volume" volume={footingVol} />
          </div>
        </Card>
      ) : null}

      {tab === "piers" ? (
        <Card>
          <CardHeader>
            <CardTitle>Piers</CardTitle>
            <CardDescription>
              Pick a diameter, then add piers. Each pier is drawn to scale.
            </CardDescription>
          </CardHeader>
          <p className="mb-2 text-sm font-medium">Diameter</p>
          <div className="mb-4 flex flex-wrap gap-2">
            {diaPresets.map((p) => {
              const label = unit === "mm" ? `${p}` : String(p);
              const on = dia === String(p) || dia === label;
              return (
                <button
                  key={p}
                  type="button"
                  onClick={() => setDia(String(p))}
                  className={
                    on
                      ? "h-11 rounded-md bg-primary px-3 text-sm font-medium text-primary-fg"
                      : "h-11 rounded-md border border-border bg-surface px-3 text-sm font-medium text-ink"
                  }
                >
                  {unit === "mm" ? `${p} mm` : `${p} m`}
                </button>
              );
            })}
          </div>
          <NumberField
            id="dia"
            label="Custom diameter"
            value={dia}
            onChange={setDia}
            unit={unit}
            step={unit === "mm" ? 50 : 0.05}
          />
          <div className="mt-5 grid grid-cols-1 gap-3">
            <NumberField
              id="qty"
              label="Quantity"
              value={qty}
              onChange={setQty}
              step={1}
              min={1}
            />
            <NumberField
              id="qty-d"
              label="Depth each"
              value={qtyDepth}
              onChange={setQtyDepth}
              unit="m"
              step={0.1}
            />
            <Button className="w-full" variant="secondary" onClick={addPiersFromQty}>
              Add piers
            </Button>
          </div>
          <ul className="mt-4 flex flex-col gap-2">
            {depths.map((d, i) => (
              <li key={i} className="flex items-end gap-2">
                <div className="min-w-0 flex-1">
                  <NumberField
                    id={`pier-${i}`}
                    label={`Pier ${i + 1} depth`}
                    value={d}
                    onChange={(v) =>
                      setDepths((prev) => prev.map((x, idx) => (idx === i ? v : x)))
                    }
                    unit="m"
                    step={0.1}
                  />
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={`Remove pier ${i + 1}`}
                  onClick={() =>
                    setDepths((prev) => prev.filter((_, idx) => idx !== i))
                  }
                >
                  <Trash2 className="size-4" />
                </Button>
              </li>
            ))}
          </ul>
          <Button
            variant="outline"
            className="mt-3"
            onClick={() => setDepths((prev) => [...prev, ""])}
          >
            <Plus className="size-4" />
            Add another pier
          </Button>
          {filledPiers.length ? (
            <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {filledPiers.map((p) => (
                <li
                  key={p.i}
                  className="overflow-hidden rounded-lg border border-border"
                >
                  <PierDiagram
                    label={`Pier ${p.i + 1}`}
                    diameter={diaN}
                    unit={unit}
                    depthM={p.depth}
                    scaleDiaM={scaleDiaM}
                    scaleDepthM={scaleDepthM}
                    volume={onePierVolumeM3(dia, unit, p.depth)}
                  />
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-4 text-sm text-muted">
              Add piers to draw each one to scale.
            </p>
          )}
          <div className="mt-4 overflow-hidden rounded-lg">
            <VolumeBanner
              caption={
                filledPiers.length
                  ? `${filledPiers.length} pier${filledPiers.length === 1 ? "" : "s"} · ${piers ? `${piers.totalM} m` : ""}`
                  : "Pier volume"
              }
              volume={piers?.volumeM3 ?? null}
            />
          </div>
        </Card>
      ) : null}

      <Card className="sticky bottom-3 mt-5 bg-primary p-5 text-primary-fg">
        <p className="font-display text-xs font-semibold uppercase tracking-display text-primary-fg/70">
          Job total
        </p>
        <p className="mt-1 font-display text-4xl font-semibold tabular-nums leading-none">
          {formatM3(total)}{" "}
          <span className="text-2xl font-medium">m³</span>
        </p>
        <p className="mt-3 text-sm text-primary-fg/80">
          {jobBits.length ? jobBits.join("  ·  ") : "Enter sizes to tally slabs, footings and piers."}
        </p>
        {total > 0 ? (
          <p className="mt-2 text-sm text-primary-fg/80">
            Order {formatM3(roundM3Order(total))} m³ if rounding up to the nearest 0.2.
          </p>
        ) : null}
        <div className="mt-3 flex flex-wrap gap-2">
          {slabVols.some(Boolean) ? (
            <span className="rounded-full bg-primary-fg/15 px-2.5 py-1 text-xs font-medium">
              Slabs
            </span>
          ) : null}
          {footingVol ? (
            <span className="rounded-full bg-primary-fg/15 px-2.5 py-1 text-xs font-medium">
              Footings
            </span>
          ) : null}
          {piers ? (
            <span className="rounded-full bg-primary-fg/15 px-2.5 py-1 text-xs font-medium">
              Piers
            </span>
          ) : null}
        </div>
      </Card>
    </AppShell>
  );
}

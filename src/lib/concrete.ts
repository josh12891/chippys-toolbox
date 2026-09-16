export type LengthUnit = 'mm' | 'm'

export function toMetres(value: number, unit: LengthUnit): number {
  if (!Number.isFinite(value) || value <= 0) return 0
  return unit === 'mm' ? value / 1000 : value
}

export function convertLength(value: number, from: LengthUnit, to: LengthUnit): number {
  if (from === to) return value
  return from === 'mm' ? value / 1000 : value * 1000
}

export function rectVolumeM3(
  height: number,
  width: number,
  depth: number,
  unit: LengthUnit,
): number {
  return toMetres(height, unit) * toMetres(width, unit) * toMetres(depth, unit)
}

export function cylinderVolumeM3(diameter: number, height: number, unit: LengthUnit): number {
  const r = toMetres(diameter, unit) / 2
  const h = toMetres(height, unit)
  return Math.PI * r * r * h
}

export function roundUpOrderQty(volumeM3: number, increment = 0.2): number {
  if (!Number.isFinite(volumeM3) || volumeM3 <= 0) return 0
  return Math.ceil(volumeM3 / increment - 1e-12) * increment
}

export function formatM3(value: number): string {
  if (!Number.isFinite(value) || value <= 0) return '0.000'
  return value.toFixed(3)
}

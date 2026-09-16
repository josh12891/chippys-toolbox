import { parseNum, toMetres, type LengthUnit } from "./format";

export type SlabInput = {
  enabled: boolean;
  height: string;
  width: string;
  depth: string;
};

export function slabVolumeM3(
  slab: SlabInput,
  unit: LengthUnit,
): number | null {
  if (!slab.enabled) return null;
  const h = parseNum(slab.height);
  const w = parseNum(slab.width);
  const d = parseNum(slab.depth);
  if (h == null || w == null || d == null) return null;
  if (h <= 0 || w <= 0 || d <= 0) return null;
  return toMetres(h, unit) * toMetres(w, unit) * toMetres(d, unit);
}

export function stripVolumeM3(opts: {
  height: string;
  width: string;
  linealM: string;
  unit: LengthUnit;
}): number | null {
  const h = parseNum(opts.height);
  const w = parseNum(opts.width);
  const l = parseNum(opts.linealM);
  if (h == null || w == null || l == null) return null;
  if (h <= 0 || w <= 0 || l <= 0) return null;
  return toMetres(h, opts.unit) * toMetres(w, opts.unit) * l;
}

export function onePierVolumeM3(
  diameter: string,
  unit: LengthUnit,
  depthM: number,
): number | null {
  const dia = parseNum(diameter);
  if (dia == null || dia <= 0 || depthM <= 0) return null;
  const r = toMetres(dia, unit) / 2;
  return Math.PI * r * r * depthM;
}

export function pierVolumeM3(opts: {
  diameter: string;
  unit: LengthUnit;
  depthsM: string[];
}): { totalM: number; volumeM3: number } | null {
  const dia = parseNum(opts.diameter);
  if (dia == null || dia <= 0) return null;
  const depths = opts.depthsM
    .map(parseNum)
    .filter((n): n is number => n != null && n > 0);
  if (depths.length === 0) return null;
  const totalM = depths.reduce((a, b) => a + b, 0);
  const r = toMetres(dia, opts.unit) / 2;
  return { totalM, volumeM3: Math.PI * r * r * totalM };
}

export function sumVolumes(parts: Array<number | null | undefined>): number {
  return parts.reduce<number>((acc, n) => acc + (n ?? 0), 0);
}

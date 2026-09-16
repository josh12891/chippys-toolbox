export type TriangleKnown = {
  a?: number | null
  b?: number | null
  c?: number | null
  angleA?: number | null
  angleB?: number | null
}

export type TriangleSolve = {
  ready: boolean
  ok: boolean
  a: number
  b: number
  c: number
  angleA: number
  angleB: number
  angleC: 90
  is345: boolean
  is51213: boolean
  notes: string[]
}

const DEG = Math.PI / 180

function present(n: number | null | undefined): n is number {
  return typeof n === 'number' && Number.isFinite(n) && n > 0
}

function close(x: number, y: number, tol = 0.02): boolean {
  return Math.abs(x - y) <= Math.max(tol, Math.abs(y) * tol)
}

function ratioMatch(sides: number[], pattern: number[], tol = 0.02): boolean {
  const sorted = [...sides].sort((x, y) => x - y)
  const scale = sorted[0] / pattern[0]
  if (scale <= 0) return false
  return pattern.every((p, i) => close(sorted[i] / scale, p, tol))
}

export function solveRightTriangle(known: TriangleKnown): TriangleSolve {
  const notes: string[] = []
  const blank: TriangleSolve = {
    ready: false,
    ok: false,
    a: 0,
    b: 0,
    c: 0,
    angleA: 0,
    angleB: 0,
    angleC: 90,
    is345: false,
    is51213: false,
    notes: ['Enter two sides, or one side and an angle.'],
  }

  let a = present(known.a) ? known.a : null
  let b = present(known.b) ? known.b : null
  let c = present(known.c) ? known.c : null
  let angleA = present(known.angleA) ? known.angleA : null
  let angleB = present(known.angleB) ? known.angleB : null

  if (angleA != null && angleA >= 90) notes.push('Angle A must be under 90°.')
  if (angleB != null && angleB >= 90) notes.push('Angle B must be under 90°.')
  if (angleA != null && angleB != null && Math.abs(angleA + angleB - 90) > 0.2) {
    notes.push('Angles A and B must add to 90°.')
  }
  if (angleA != null && angleB == null) angleB = 90 - angleA
  if (angleB != null && angleA == null) angleA = 90 - angleB

  if (a != null && c != null && a >= c) notes.push('Leg A must be shorter than the hypotenuse.')
  if (b != null && c != null && b >= c) notes.push('Leg B must be shorter than the hypotenuse.')

  if (a != null && b != null) c = Math.hypot(a, b)
  else if (a != null && c != null) b = Math.sqrt(Math.max(c * c - a * a, 0))
  else if (b != null && c != null) a = Math.sqrt(Math.max(c * c - b * b, 0))
  else if (a != null && angleA != null) {
    b = a / Math.tan(angleA * DEG)
    c = a / Math.sin(angleA * DEG)
  } else if (a != null && angleB != null) {
    b = a * Math.tan(angleB * DEG)
    c = a / Math.cos(angleB * DEG)
  } else if (b != null && angleA != null) {
    a = b * Math.tan(angleA * DEG)
    c = b / Math.cos(angleA * DEG)
  } else if (b != null && angleB != null) {
    a = b / Math.tan(angleB * DEG)
    c = b / Math.sin(angleB * DEG)
  } else if (c != null && angleA != null) {
    a = c * Math.sin(angleA * DEG)
    b = c * Math.cos(angleA * DEG)
  } else if (c != null && angleB != null) {
    b = c * Math.sin(angleB * DEG)
    a = c * Math.cos(angleB * DEG)
  } else {
    return notes.length ? { ...blank, notes } : blank
  }

  if (a == null || b == null || c == null) return blank

  angleA = (Math.atan2(a, b) * 180) / Math.PI
  angleB = 90 - angleA

  const is345 = ratioMatch([a, b, c], [3, 4, 5])
  const is51213 = ratioMatch([a, b, c], [5, 12, 13])
  if (is345) notes.push('This is a 3-4-5 triangle — a square set-out.')
  else if (is51213) notes.push('This is a 5-12-13 triangle — also square.')
  else notes.push('Right angle solved from the sides and angles you entered.')

  return {
    ready: true,
    ok: a > 0 && b > 0 && c > 0 && Math.abs(a * a + b * b - c * c) < 1e-6 * c * c,
    a,
    b,
    c,
    angleA,
    angleB,
    angleC: 90,
    is345,
    is51213,
    notes,
  }
}

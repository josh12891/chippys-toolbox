export type StairCode = 'ncc-housing' | 'as1657'
export type GoingMode = 'auto' | 'tread' | 'overall-run'

export type StairLimits = {
  label: string
  riserMin: number
  riserMax: number
  goingMin: number
  goingMax: number
  twoRGMin: number
  twoRGMax: number
  maxRisersPerFlight: number
  minRisersPerFlight: number
  pitchMin: number | null
  pitchMax: number | null
}

export const STAIR_LIMITS: Record<StairCode, StairLimits> = {
  'ncc-housing': {
    label: 'NCC Housing',
    riserMin: 115,
    riserMax: 190,
    goingMin: 240,
    goingMax: 355,
    twoRGMin: 550,
    twoRGMax: 700,
    maxRisersPerFlight: 18,
    minRisersPerFlight: 2,
    pitchMin: null,
    pitchMax: null,
  },
  as1657: {
    label: 'AS 1657',
    riserMin: 130,
    riserMax: 225,
    goingMin: 215,
    goingMax: 355,
    twoRGMin: 540,
    twoRGMax: 700,
    maxRisersPerFlight: 18,
    minRisersPerFlight: 2,
    pitchMin: 20,
    pitchMax: 45,
  },
}

export type StairInput = {
  code: StairCode
  overallHeightMm: number
  stairWidthMm: number
  goingMode: GoingMode
  treadMm: number
  overallRunMm: number
}

export type FlightPlan = {
  risers: number
  goings: number
  riseMm: number
  goingMm: number
  runMm: number
}

export type StairResult = {
  ready: boolean
  limits: StairLimits
  totalRisers: number
  flights: FlightPlan[]
  landingCount: number
  landingDepthMm: number
  riseMm: number
  goingMm: number
  goingCount: number
  totalRunMm: number
  twoRG: number
  pitchDeg: number
  stringerMm: number
  withinRiser: boolean
  withinGoing: boolean
  withinTwoRG: boolean
  withinPitch: boolean
  withinFlight: boolean
  ok: boolean
  notes: string[]
}

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n))
}

function splitFlights(totalRisers: number, maxPerFlight: number): number[] {
  const flightCount = Math.max(1, Math.ceil(totalRisers / maxPerFlight))
  const base = Math.floor(totalRisers / flightCount)
  const extra = totalRisers % flightCount
  const flights: number[] = []
  for (let i = 0; i < flightCount; i += 1) {
    flights.push(base + (i < extra ? 1 : 0))
  }
  return flights.filter((n) => n > 0)
}

function scoreCandidate(
  rise: number,
  going: number,
  limits: StairLimits,
  preferredRise: number,
): number {
  const twoRG = 2 * rise + going
  const pitch = (Math.atan(rise / going) * 180) / Math.PI
  let score = 0
  if (rise >= limits.riserMin && rise <= limits.riserMax) score += 50
  if (going >= limits.goingMin && going <= limits.goingMax) score += 50
  if (twoRG >= limits.twoRGMin && twoRG <= limits.twoRGMax) score += 80
  if (limits.pitchMin != null && limits.pitchMax != null) {
    if (pitch >= limits.pitchMin && pitch <= limits.pitchMax) score += 30
    if (pitch >= 30 && pitch <= 38) score += 20
  }
  score -= Math.abs(rise - preferredRise) * 0.4
  score -= Math.abs(twoRG - (limits.twoRGMin + limits.twoRGMax) / 2) * 0.15
  return score
}

export function planStair(input: StairInput): StairResult {
  const limits = STAIR_LIMITS[input.code]
  const H = input.overallHeightMm
  const notes: string[] = []
  const emptyFlights: FlightPlan[] = []

  const blank: StairResult = {
    ready: false,
    limits,
    totalRisers: 0,
    flights: emptyFlights,
    landingCount: 0,
    landingDepthMm: 0,
    riseMm: 0,
    goingMm: 0,
    goingCount: 0,
    totalRunMm: 0,
    twoRG: 0,
    pitchDeg: 0,
    stringerMm: 0,
    withinRiser: false,
    withinGoing: false,
    withinTwoRG: false,
    withinPitch: true,
    withinFlight: true,
    ok: false,
    notes: ['Enter floor-to-floor height to set out.'],
  }

  if (!Number.isFinite(H) || H <= 0) return blank

  const nMin = Math.max(limits.minRisersPerFlight, Math.ceil(H / limits.riserMax - 1e-9))
  const nMaxNatural = Math.floor(H / limits.riserMin + 1e-9)
  const nMax = Math.max(nMin, nMaxNatural)

  if (nMax < limits.minRisersPerFlight) {
    return { ...blank, notes: ['Height is too small for a code stair.'] }
  }

  const preferredRise = input.code === 'ncc-housing' ? 175 : 180
  let bestN = nMin
  let bestGoing = limits.goingMin
  let bestScore = -Infinity

  for (let n = nMin; n <= nMax; n += 1) {
    const rise = H / n
    const flights = splitFlights(n, limits.maxRisersPerFlight)
    const goingCount = Math.max(1, n - flights.length)
    let going = 0
    if (input.goingMode === 'tread') {
      going = input.treadMm
    } else if (input.goingMode === 'overall-run') {
      going = goingCount > 0 ? input.overallRunMm / goingCount : 0
    } else {
      const target = (limits.twoRGMin + limits.twoRGMax) / 2
      going = clamp(Math.round((target - 2 * rise) / 5) * 5, limits.goingMin, limits.goingMax)
    }
    if (!Number.isFinite(going) || going <= 0) continue
    const score = scoreCandidate(rise, going, limits, preferredRise)
    if (score > bestScore) {
      bestScore = score
      bestN = n
      bestGoing = going
    }
  }

  const riseMm = H / bestN
  const flightsRisers = splitFlights(bestN, limits.maxRisersPerFlight)
  const landingCount = Math.max(0, flightsRisers.length - 1)
  const landingDepthMm = landingCount > 0 ? Math.max(input.stairWidthMm || 0, 750) : 0
  const goingCount = Math.max(1, bestN - flightsRisers.length)
  const goingMm = bestGoing
  const twoRG = 2 * riseMm + goingMm
  const pitchDeg = (Math.atan(riseMm / goingMm) * 180) / Math.PI
  const flightRun = goingMm * goingCount
  const totalRunMm = flightRun + landingDepthMm * landingCount
  const stringerMm = Math.hypot(H, flightRun)

  const flights: FlightPlan[] = flightsRisers.map((risers) => {
    const goings = Math.max(0, risers - 1)
    return {
      risers,
      goings,
      riseMm,
      goingMm,
      runMm: goings * goingMm,
    }
  })

  const withinRiser = riseMm >= limits.riserMin - 0.05 && riseMm <= limits.riserMax + 0.05
  const withinGoing = goingMm >= limits.goingMin - 0.05 && goingMm <= limits.goingMax + 0.05
  const withinTwoRG = twoRG >= limits.twoRGMin - 0.05 && twoRG <= limits.twoRGMax + 0.05
  const withinPitch =
    limits.pitchMin == null ||
    limits.pitchMax == null ||
    (pitchDeg >= limits.pitchMin - 0.05 && pitchDeg <= limits.pitchMax + 0.05)
  const withinFlight = flights.every(
    (f) =>
      f.risers >= limits.minRisersPerFlight && f.risers <= limits.maxRisersPerFlight,
  )
  const ok = withinRiser && withinGoing && withinTwoRG && withinPitch && withinFlight

  if (landingCount > 0) {
    notes.push(
      `More than ${limits.maxRisersPerFlight} risers — ${landingCount} landing${landingCount === 1 ? '' : 's'} inserted.`,
    )
  }
  if (!withinRiser) notes.push(`Riser is outside ${limits.riserMin}–${limits.riserMax} mm.`)
  if (!withinGoing) notes.push(`Going is outside ${limits.goingMin}–${limits.goingMax} mm.`)
  if (!withinTwoRG) notes.push(`2R+G is outside ${limits.twoRGMin}–${limits.twoRGMax} mm.`)
  if (!withinPitch && limits.pitchMin != null && limits.pitchMax != null) {
    notes.push(`Pitch is outside ${limits.pitchMin}–${limits.pitchMax}°.`)
  }
  if (ok) notes.push(`Within ${limits.label} limits — confirm with the certifier on the job.`)

  return {
    ready: true,
    limits,
    totalRisers: bestN,
    flights,
    landingCount,
    landingDepthMm,
    riseMm,
    goingMm,
    goingCount,
    totalRunMm,
    twoRG,
    pitchDeg,
    stringerMm,
    withinRiser,
    withinGoing,
    withinTwoRG,
    withinPitch,
    withinFlight,
    ok,
    notes,
  }
}

export function formatMm(value: number, digits = 1): string {
  if (!Number.isFinite(value) || value === 0) return '0'
  const rounded = Number(value.toFixed(digits))
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(digits)
}

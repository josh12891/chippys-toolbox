export type SetoutKind = 'studs' | 'balustrade'
export type RunningMode = 'count' | 'spaces' | 'max-gap'

export type RunningInput = {
  kind: SetoutKind
  mode: RunningMode
  overallMm: number
  memberWidthMm: number
  count: number
  spaces: number
  maxGapMm: number
}

export type RunningResult = {
  ready: boolean
  ok: boolean
  memberCount: number
  spaceCount: number
  gapMm: number
  centreSpacingMm: number
  startsMm: number[]
  centresMm: number[]
  marksMm: number[]
  notes: string[]
}

function round1(n: number): number {
  return Math.round(n * 10) / 10
}

function studCountFromMaxGap(overall: number, width: number, maxGap: number): number {
  if (overall <= width) return 1
  const n = Math.ceil((overall + maxGap) / (width + maxGap) - 1e-9)
  return Math.max(2, n)
}

function balusterCountFromMaxGap(overall: number, width: number, maxGap: number): number {
  if (overall <= 0) return 0
  if (overall <= maxGap) return 0
  const n = Math.ceil((overall - maxGap) / (width + maxGap) - 1e-9)
  return Math.max(0, n)
}

export function planRunning(input: RunningInput): RunningResult {
  const notes: string[] = []
  const blank: RunningResult = {
    ready: false,
    ok: false,
    memberCount: 0,
    spaceCount: 0,
    gapMm: 0,
    centreSpacingMm: 0,
    startsMm: [],
    centresMm: [],
    marksMm: [],
    notes: ['Enter overall length and member width.'],
  }

  const L = input.overallMm
  const W = input.memberWidthMm
  if (!Number.isFinite(L) || L <= 0 || !Number.isFinite(W) || W <= 0) return blank

  let memberCount = 0
  if (input.kind === 'studs') {
    if (input.mode === 'count') memberCount = Math.max(1, Math.round(input.count))
    else if (input.mode === 'spaces') memberCount = Math.max(1, Math.round(input.spaces) + 1)
    else memberCount = studCountFromMaxGap(L, W, Math.max(1, input.maxGapMm))
  } else if (input.mode === 'count') {
    memberCount = Math.max(0, Math.round(input.count))
  } else if (input.mode === 'spaces') {
    memberCount = Math.max(0, Math.round(input.spaces) - 1)
  } else {
    memberCount = balusterCountFromMaxGap(L, W, Math.max(1, input.maxGapMm))
  }

  const usedWidth = memberCount * W
  if (usedWidth > L + 1e-6) {
    return {
      ...blank,
      ready: true,
      notes: ['Members are wider than the overall length.'],
    }
  }

  let gapMm = 0
  let spaceCount = 0
  const startsMm: number[] = []

  if (input.kind === 'studs') {
    if (memberCount === 1) {
      spaceCount = 0
      gapMm = 0
      startsMm.push(round1((L - W) / 2))
    } else {
      spaceCount = memberCount - 1
      gapMm = (L - usedWidth) / spaceCount
      for (let i = 0; i < memberCount; i += 1) {
        startsMm.push(round1(i * (gapMm + W)))
      }
    }
  } else {
    spaceCount = memberCount + 1
    gapMm = spaceCount > 0 ? (L - usedWidth) / spaceCount : 0
    for (let i = 0; i < memberCount; i += 1) {
      startsMm.push(round1(gapMm + i * (gapMm + W)))
    }
  }

  const centresMm = startsMm.map((s) => round1(s + W / 2))
  const centreSpacingMm =
    centresMm.length >= 2 ? round1(centresMm[1] - centresMm[0]) : 0
  const marksMm = startsMm.map((s) => round1(s))

  if (gapMm < -0.05) notes.push('Gaps have gone negative — drop a member or lengthen the run.')
  if (input.mode === 'max-gap' && gapMm - input.maxGapMm > 0.05) {
    notes.push('Could not keep the gap under the maximum.')
  }
  if (input.kind === 'studs') {
    notes.push('Studs sit on the ends. Tick centres or edges as you walk the tape.')
  } else {
    notes.push('Balusters sit between posts, with equal gaps each side.')
  }

  return {
    ready: true,
    ok: gapMm >= -0.05 && usedWidth <= L + 0.05,
    memberCount,
    spaceCount,
    gapMm: round1(gapMm),
    centreSpacingMm,
    startsMm,
    centresMm,
    marksMm,
    notes,
  }
}

export function marksSpeech(result: RunningResult): string {
  if (!result.ready || result.marksMm.length === 0) {
    return 'Enter a length to read the marks.'
  }
  const body = result.marksMm
    .map((mark, i) => `Mark ${i + 1}, ${speechMm(mark)}.`)
    .join(' ')
  return `${body} End of run.`
}

export function speechMm(value: number): string {
  const n = Math.round(value)
  if (n === 0) return 'zero millimetres'
  return `${n} millimetres`
}

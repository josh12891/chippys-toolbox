import { describe, expect, it } from 'vitest'
import { planRunning } from './running.ts'

describe('running measurements', () => {
  it('puts studs on the ends with equal gaps', () => {
    const result = planRunning({
      kind: 'studs',
      mode: 'count',
      overallMm: 2400,
      memberWidthMm: 90,
      count: 5,
      spaces: 4,
      maxGapMm: 450,
    })
    expect(result.memberCount).toBe(5)
    expect(result.spaceCount).toBe(4)
    expect(result.startsMm[0]).toBe(0)
    expect(result.startsMm.at(-1)).toBe(2310)
    expect(result.gapMm).toBeCloseTo(487.5, 6)
    expect(result.centreSpacingMm).toBeCloseTo(577.5, 6)
  })

  it('spaces balusters between posts', () => {
    const result = planRunning({
      kind: 'balustrade',
      mode: 'count',
      overallMm: 1000,
      memberWidthMm: 42,
      count: 3,
      spaces: 4,
      maxGapMm: 125,
    })
    expect(result.spaceCount).toBe(4)
    expect(result.gapMm).toBeCloseTo(218.5, 6)
    expect(result.startsMm[0]).toBeCloseTo(218.5, 6)
  })

  it('sizes a balustrade from a 125 mm max gap', () => {
    const result = planRunning({
      kind: 'balustrade',
      mode: 'max-gap',
      overallMm: 1000,
      memberWidthMm: 42,
      count: 0,
      spaces: 0,
      maxGapMm: 125,
    })
    expect(result.memberCount).toBeGreaterThan(0)
    expect(result.gapMm).toBeLessThanOrEqual(125.05)
  })
})

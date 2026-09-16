import { describe, expect, it } from 'vitest'
import { computeRunning } from './running.ts'

describe('running measurements', () => {
  it('puts members on the ends with equal gaps', () => {
    const result = computeRunning({
      overall: 2400,
      member: 90,
      layout: 'ends',
      countMode: 'members',
      count: 5,
      maxGap: 450,
    })
    expect(result?.members).toBe(5)
    expect(result?.spaces).toBe(4)
    expect(result?.marks[0]?.left).toBe(0)
    expect(result?.marks.at(-1)?.left).toBeCloseTo(2310, 6)
    expect(result?.gap).toBeCloseTo(487.5, 6)
    expect(result?.centres).toBeCloseTo(577.5, 6)
  })

  it('spaces members between posts', () => {
    const result = computeRunning({
      overall: 1000,
      member: 42,
      layout: 'between',
      countMode: 'members',
      count: 3,
      maxGap: 125,
    })
    expect(result?.spaces).toBe(4)
    expect(result?.gap).toBeCloseTo(218.5, 6)
    expect(result?.marks[0]?.left).toBeCloseTo(218.5, 6)
  })

  it('sizes a balustrade from a 125 mm max gap', () => {
    const result = computeRunning({
      overall: 1000,
      member: 42,
      layout: 'between',
      countMode: 'max',
      count: 0,
      maxGap: 125,
    })
    expect(result?.members).toBeGreaterThan(0)
    expect(result?.gap).toBeLessThanOrEqual(125.05)
  })
})

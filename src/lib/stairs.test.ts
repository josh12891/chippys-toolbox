import { describe, expect, it } from 'vitest'
import { setOutStairs } from './stairs.ts'

describe('stair set-out', () => {
  it('sets out a 2700 mm NCC Housing flight near 180 mm rise', () => {
    const result = setOutStairs({
      totalRiseMm: 2700,
      standard: 'ncc',
      goingMode: 'auto',
      stairWidthMm: 900,
    })
    expect(result).not.toBeNull()
    expect(result?.risers).toBe(15)
    expect(result?.riseMm).toBeCloseTo(180, 6)
    expect(result?.goingMm).toBeGreaterThanOrEqual(240)
    expect(result?.goingMm).toBeLessThanOrEqual(355)
    expect(result?.slopeMm).toBeGreaterThanOrEqual(550)
    expect(result?.slopeMm).toBeLessThanOrEqual(700)
    expect(result?.landings).toBe(0)
    expect(result?.compliant).toBe(true)
  })

  it('uses a manual tread', () => {
    const result = setOutStairs({
      totalRiseMm: 2700,
      standard: 'ncc',
      goingMode: 'tread',
      treadGoingMm: 250,
      stairWidthMm: 900,
    })
    expect(result?.goingMm).toBe(250)
    expect(result?.treads).toBe(14)
    expect(result?.overallGoingMm).toBe(3500)
  })

  it('inserts a landing when more than 18 risers are required', () => {
    const result = setOutStairs({
      totalRiseMm: 3800,
      standard: 'ncc',
      goingMode: 'auto',
      stairWidthMm: 900,
    })
    expect(result?.risers).toBeGreaterThan(18)
    expect(result?.landings).toBeGreaterThanOrEqual(1)
    expect(result?.flights.every((f) => f.risers <= 18)).toBe(true)
  })
})

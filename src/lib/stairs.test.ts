import { describe, expect, it } from 'vitest'
import { planStair } from './stairs.ts'

describe('stair set-out', () => {
  it('sets out a 2700 mm NCC Housing flight at 180 mm rise', () => {
    const result = planStair({
      code: 'ncc-housing',
      overallHeightMm: 2700,
      stairWidthMm: 900,
      goingMode: 'auto',
      treadMm: 0,
      overallRunMm: 0,
    })
    expect(result.ready).toBe(true)
    expect(result.totalRisers).toBe(15)
    expect(result.riseMm).toBeCloseTo(180, 6)
    expect(result.goingMm).toBeGreaterThanOrEqual(240)
    expect(result.goingMm).toBeLessThanOrEqual(355)
    expect(result.twoRG).toBeGreaterThanOrEqual(550)
    expect(result.twoRG).toBeLessThanOrEqual(700)
    expect(result.landingCount).toBe(0)
    expect(result.ok).toBe(true)
  })

  it('uses a manual tread', () => {
    const result = planStair({
      code: 'ncc-housing',
      overallHeightMm: 2700,
      stairWidthMm: 900,
      goingMode: 'tread',
      treadMm: 250,
      overallRunMm: 0,
    })
    expect(result.goingMm).toBe(250)
    expect(result.goingCount).toBe(14)
    expect(result.totalRunMm).toBe(3500)
  })

  it('inserts a landing when more than 18 risers are required', () => {
    const result = planStair({
      code: 'ncc-housing',
      overallHeightMm: 3800,
      stairWidthMm: 900,
      goingMode: 'auto',
      treadMm: 0,
      overallRunMm: 0,
    })
    expect(result.totalRisers).toBeGreaterThan(18)
    expect(result.landingCount).toBeGreaterThanOrEqual(1)
    expect(result.flights.every((f) => f.risers <= 18)).toBe(true)
  })

  it('applies AS 1657 pitch limits', () => {
    const result = planStair({
      code: 'as1657',
      overallHeightMm: 3000,
      stairWidthMm: 900,
      goingMode: 'auto',
      treadMm: 0,
      overallRunMm: 0,
    })
    expect(result.riseMm).toBeGreaterThanOrEqual(130)
    expect(result.riseMm).toBeLessThanOrEqual(225)
    expect(result.pitchDeg).toBeGreaterThan(0)
  })
})

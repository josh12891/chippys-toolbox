import { describe, expect, it } from 'vitest'
import { solveRightTriangle } from './triangle.ts'

describe('right-angle triangle', () => {
  it('solves from run and rise and detects 3-4-5', () => {
    const result = solveRightTriangle({ run: 1200, rise: 900, hyp: null, angleRun: null, angleRise: null })
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.hyp).toBeCloseTo(1500, 6)
      expect(result.is345).toBe(true)
    }
  })

  it('solves from hypotenuse and an angle', () => {
    const result = solveRightTriangle({
      run: null,
      rise: null,
      hyp: 1000,
      angleRun: 30,
      angleRise: null,
    })
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.rise).toBeCloseTo(500, 3)
      expect(result.run).toBeCloseTo(866.025, 3)
    }
  })
})

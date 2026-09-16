import { describe, expect, it } from 'vitest'
import { solveRightTriangle } from './triangle.ts'

describe('right-angle triangle', () => {
  it('solves from two legs and detects 3-4-5', () => {
    const result = solveRightTriangle({ a: 900, b: 1200 })
    expect(result.c).toBeCloseTo(1500, 6)
    expect(result.is345).toBe(true)
    expect(result.ok).toBe(true)
  })

  it('solves from hypotenuse and an angle', () => {
    const result = solveRightTriangle({ c: 1000, angleA: 30 })
    expect(result.a).toBeCloseTo(500, 4)
    expect(result.b).toBeCloseTo(866.025, 3)
    expect(result.angleB).toBeCloseTo(60, 4)
  })

  it('detects 5-12-13', () => {
    const result = solveRightTriangle({ a: 500, b: 1200 })
    expect(result.c).toBeCloseTo(1300, 6)
    expect(result.is51213).toBe(true)
  })
})

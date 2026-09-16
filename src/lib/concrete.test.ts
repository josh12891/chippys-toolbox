import { describe, expect, it } from 'vitest'
import {
  convertLength,
  cylinderVolumeM3,
  formatM3,
  rectVolumeM3,
  roundUpOrderQty,
} from './concrete.ts'

describe('concrete volumes', () => {
  it('computes a 100 mm slab in cubic metres', () => {
    expect(rectVolumeM3(100, 4000, 6000, 'mm')).toBeCloseTo(2.4, 6)
  })

  it('accepts metre inputs', () => {
    expect(rectVolumeM3(0.1, 4, 6, 'm')).toBeCloseTo(2.4, 6)
  })

  it('computes a round pier', () => {
    expect(cylinderVolumeM3(450, 1200, 'mm')).toBeCloseTo(0.190852, 4)
  })

  it('rounds orders up to 0.2 m³', () => {
    expect(roundUpOrderQty(0)).toBe(0)
    expect(roundUpOrderQty(0.01)).toBeCloseTo(0.2, 6)
    expect(roundUpOrderQty(0.2)).toBeCloseTo(0.2, 6)
    expect(roundUpOrderQty(2.41)).toBeCloseTo(2.6, 6)
  })

  it('converts units both ways', () => {
    expect(convertLength(2500, 'mm', 'm')).toBeCloseTo(2.5, 9)
    expect(convertLength(2.5, 'm', 'mm')).toBeCloseTo(2500, 9)
  })

  it('formats empty totals', () => {
    expect(formatM3(0)).toBe('0.000')
  })
})

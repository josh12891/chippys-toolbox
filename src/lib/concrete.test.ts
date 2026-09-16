import { describe, expect, it } from 'vitest'
import { pierVolumeM3, slabVolumeM3, stripVolumeM3 } from './concrete.ts'
import { roundM3Order } from './format.ts'

describe('concrete volumes', () => {
  it('computes a 100 mm slab in cubic metres', () => {
    expect(
      slabVolumeM3(
        { enabled: true, height: '100', width: '4000', depth: '6000' },
        'mm',
      ),
    ).toBeCloseTo(2.4, 6)
  })

  it('accepts metre inputs', () => {
    expect(
      slabVolumeM3({ enabled: true, height: '0.1', width: '4', depth: '6' }, 'm'),
    ).toBeCloseTo(2.4, 6)
  })

  it('computes strip footings from lineal metres', () => {
    expect(
      stripVolumeM3({ height: '400', width: '300', linealM: '12', unit: 'mm' }),
    ).toBeCloseTo(1.44, 6)
  })

  it('computes round piers', () => {
    const piers = pierVolumeM3({ diameter: '450', unit: 'mm', depthsM: ['1.2'] })
    expect(piers?.volumeM3).toBeCloseTo(0.190852, 4)
  })

  it('rounds orders up to 0.2 m³', () => {
    expect(roundM3Order(0)).toBe(0)
    expect(roundM3Order(0.01)).toBeCloseTo(0.2, 6)
    expect(roundM3Order(0.2)).toBeCloseTo(0.2, 6)
    expect(roundM3Order(2.41)).toBeCloseTo(2.6, 6)
  })
})

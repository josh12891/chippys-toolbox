import { describe, expect, it } from 'vitest'
import {
  computeRunning,
  RUNNING_DIAGRAM_HEAD,
  RUNNING_DIAGRAM_TAIL,
  runningDiagramDrawnMemberCount,
  runningDiagramModel,
} from './running.ts'

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
    expect(result?.marks).toHaveLength(5)
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
    expect(result?.members).toBe(3)
    expect(result?.spaces).toBe(4)
    expect(result?.marks).toHaveLength(3)
    expect(result?.gap).toBeCloseTo(218.5, 6)
    expect(result?.marks[0]?.left).toBeCloseTo(218.5, 6)
  })

  it('counts posts vs spaces without an off-by-one', () => {
    const studs = computeRunning({
      overall: 2400,
      member: 90,
      layout: 'ends',
      countMode: 'spaces',
      count: 4,
      maxGap: 450,
    })
    expect(studs?.spaces).toBe(4)
    expect(studs?.members).toBe(5)
    expect(studs?.marks).toHaveLength(5)

    const balusters = computeRunning({
      overall: 1000,
      member: 42,
      layout: 'between',
      countMode: 'spaces',
      count: 4,
      maxGap: 125,
    })
    expect(balusters?.spaces).toBe(4)
    expect(balusters?.members).toBe(3)
    expect(balusters?.marks).toHaveLength(3)
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
    expect(result?.marks).toHaveLength(result!.members)
    expect(result?.gap).toBeLessThanOrEqual(125.05)
  })
})

describe('running diagram counts', () => {
  it('draws every stud on the ends — no extra posts, no dropped marks', () => {
    const result = computeRunning({
      overall: 2400,
      member: 90,
      layout: 'ends',
      countMode: 'members',
      count: 5,
      maxGap: 450,
    })
    expect(result).not.toBeNull()
    const model = runningDiagramModel(result!)
    expect(model.memberCount).toBe(5)
    expect(model.endPosts).toHaveLength(0)
    expect(model.ellipsis).toBe(false)
    expect(runningDiagramDrawnMemberCount(model)).toBe(5)
    expect(model.head.map((m) => m.index)).toEqual([1, 2, 3, 4, 5])
    expect(model.spanStart).toBe(0)
    expect(model.spanEnd).toBe(2400)
  })

  it('draws balusters plus the two end posts that define the opening', () => {
    const result = computeRunning({
      overall: 1000,
      member: 42,
      layout: 'between',
      countMode: 'members',
      count: 3,
      maxGap: 125,
    })
    expect(result).not.toBeNull()
    const model = runningDiagramModel(result!)
    expect(model.memberCount).toBe(3)
    expect(model.head).toHaveLength(3)
    expect(runningDiagramDrawnMemberCount(model)).toBe(result!.marks.length)
    expect(model.endPosts).toHaveLength(2)
    expect(model.endPosts[0]?.left).toBe(-42)
    expect(model.endPosts[1]?.left).toBe(1000)
    expect(model.spanStart).toBe(-42)
    expect(model.spanEnd).toBe(1042)
  })

  it('keeps every shown member when truncating instead of replacing one with ellipsis', () => {
    const result = computeRunning({
      overall: 12000,
      member: 90,
      layout: 'ends',
      countMode: 'members',
      count: 20,
      maxGap: 450,
    })
    expect(result).not.toBeNull()
    expect(result!.marks).toHaveLength(20)
    const model = runningDiagramModel(result!)
    expect(model.ellipsis).toBe(true)
    expect(model.head).toHaveLength(RUNNING_DIAGRAM_HEAD)
    expect(model.tail).toHaveLength(RUNNING_DIAGRAM_TAIL)
    expect(runningDiagramDrawnMemberCount(model)).toBe(
      RUNNING_DIAGRAM_HEAD + RUNNING_DIAGRAM_TAIL,
    )
    expect(model.head.map((m) => m.index)).toEqual([1, 2, 3, 4, 5, 6, 7, 8])
    expect(model.tail.map((m) => m.index)).toEqual([13, 14, 15, 16, 17, 18, 19, 20])
    expect(model.head[0]?.index).toBe(result!.marks[0]?.index)
    expect(model.tail[0]?.index).toBe(result!.marks[12]?.index)
  })
})

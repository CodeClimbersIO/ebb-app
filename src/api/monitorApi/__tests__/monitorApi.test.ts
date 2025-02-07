import { describe, it, expect } from 'vitest'
import { mockActivityStates } from './activityState.mock'
import { createTimeBlockFromActivityState } from '../monitorApi'

describe('createTimeBlockFromActivityState', () => {
  it('should create time blocks from activity states', () => {
    const activityStates = mockActivityStates()
    const timeBlocks = createTimeBlockFromActivityState(activityStates)
    expect(timeBlocks).toHaveLength(24)
  })

  it('10 am should have the 4 tags, creating, consuming, creating, consuming with the correct duration', () => {
  const activityStates = mockActivityStates()
  const timeBlocks = createTimeBlockFromActivityState(activityStates)
    expect(Object.keys(timeBlocks[10].tags).length).toBe(4)
    expect(timeBlocks[10].tags['creating'].name).toBeDefined()
    expect(timeBlocks[10].tags['consuming'].name).toBeDefined()
    expect(timeBlocks[10].tags['neutral'].name).toBeDefined()
    expect(timeBlocks[10].tags['idle'].name).toBeDefined()
    expect(timeBlocks[10].tags['creating'].duration).toBe(46)
    expect(timeBlocks[10].tags['consuming'].duration).toBe(4)
    expect(timeBlocks[10].tags['neutral'].duration).toBe(1.5)
    expect(timeBlocks[10].tags['idle'].duration).toBe(8.5)
  })

  it('9 am should have no tags', () => {
    const activityStates = mockActivityStates()
    const timeBlocks = createTimeBlockFromActivityState(activityStates)
    expect(Object.keys(timeBlocks[9].tags).length).toBe(0)
  })
})

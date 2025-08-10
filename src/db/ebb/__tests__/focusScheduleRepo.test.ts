import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { FocusScheduleRepo, type CreateFocusSchedule } from '../focusScheduleRepo'
import { createEbbTestDatabase } from '@/lib/utils/testDb.util'
import { getEbbDb } from '../ebbDb'
import type Database from '@tauri-apps/plugin-sql'

// Mock the getEbbDb function to use our test database
vi.mock('../ebbDb', () => ({
  getEbbDb: vi.fn()
}))

// Mock crypto.randomUUID for predictable IDs
Object.defineProperty(globalThis, 'crypto', {
  value: {
    randomUUID: vi.fn(() => 'test-uuid-123'),
  },
})

// Mock self.crypto (used in repository code)
Object.defineProperty(globalThis, 'self', {
  value: {
    crypto: {
      randomUUID: vi.fn(() => 'test-uuid-123'),
    },
  },
})

describe('FocusScheduleRepo', () => {
  let testDb: Database

  beforeEach(async () => {
    testDb = await createEbbTestDatabase()
    vi.mocked(getEbbDb).mockResolvedValue(testDb)
  })

  afterEach(async () => {
    if (testDb) {
      await testDb.close()
    }
    vi.clearAllMocks()
  })

  describe('WHERE condition filtering', () => {
    beforeEach(async () => {
      // Create test workflow for foreign key constraint
      await testDb.execute(`
        INSERT INTO workflow (id, name, settings) 
        VALUES ('workflow-1', 'Test Workflow', '{}')
      `)

      // Insert test data with mix of active/inactive schedules
      await testDb.execute(`
        INSERT INTO focus_schedule (id, scheduled_time, workflow_id, is_active, recurrence_settings)
        VALUES 
          ('active-1', '2024-01-15T09:00:00Z', 'workflow-1', 1, '{"type":"daily"}'),
          ('active-2', '2024-01-16T10:00:00Z', 'workflow-1', 1, '{"type":"weekly","daysOfWeek":[1,2,3]}'),
          ('inactive-1', '2024-01-17T11:00:00Z', 'workflow-1', 0, '{"type":"none"}'),
          ('active-3', '2024-01-14T08:00:00Z', 'workflow-1', 1, NULL)
      `)
    })

    it('getFocusSchedules should only return active schedules (is_active = 1)', async () => {
      const schedules = await FocusScheduleRepo.getFocusSchedules()

      expect(schedules).toHaveLength(3)
      expect(schedules.every(s => s.is_active === 1)).toBe(true)
      
      const ids = schedules.map(s => s.id)
      expect(ids).toContain('active-1')
      expect(ids).toContain('active-2') 
      expect(ids).toContain('active-3')
      expect(ids).not.toContain('inactive-1')
    })

    it('getFocusScheduleById should only return active schedule by id', async () => {
      // Should find active schedule
      const activeSchedule = await FocusScheduleRepo.getFocusScheduleById('active-1')
      expect(activeSchedule).toBeDefined()
      expect(activeSchedule!.id).toBe('active-1')

      // Should not find inactive schedule even with valid ID
      const inactiveSchedule = await FocusScheduleRepo.getFocusScheduleById('inactive-1')
      expect(inactiveSchedule).toBeUndefined()

      // Should not find non-existent schedule
      const nonExistent = await FocusScheduleRepo.getFocusScheduleById('non-existent')
      expect(nonExistent).toBeUndefined()
    })

    it('getFocusSchedulesWithWorkflow should only return active schedules', async () => {
      const schedules = await FocusScheduleRepo.getFocusSchedulesWithWorkflow()

      expect(schedules).toHaveLength(3)
      expect(schedules.every(s => s.is_active === 1)).toBe(true)
      
      const ids = schedules.map(s => s.id)
      expect(ids).not.toContain('inactive-1')
    })
  })

  describe('ORDER BY scheduled_time ASC', () => {
    beforeEach(async () => {
      await testDb.execute(`
        INSERT INTO workflow (id, name, settings) 
        VALUES ('workflow-1', 'Test Workflow', '{}')
      `)

      // Insert schedules in non-chronological order
      await testDb.execute(`
        INSERT INTO focus_schedule (id, scheduled_time, workflow_id, is_active)
        VALUES 
          ('schedule-c', '2024-01-17T15:00:00Z', 'workflow-1', 1),
          ('schedule-a', '2024-01-15T09:00:00Z', 'workflow-1', 1),
          ('schedule-d', '2024-01-18T16:00:00Z', 'workflow-1', 1),
          ('schedule-b', '2024-01-16T12:00:00Z', 'workflow-1', 1)
      `)
    })

    it('getFocusSchedules should order by scheduled_time ASC', async () => {
      const schedules = await FocusScheduleRepo.getFocusSchedules()

      expect(schedules).toHaveLength(4)
      
      const scheduledTimes = schedules.map(s => s.scheduled_time)
      const sortedTimes = [...scheduledTimes].sort()
      
      expect(scheduledTimes).toEqual(sortedTimes)
      
      // Verify specific order
      expect(schedules[0].id).toBe('schedule-a') // 2024-01-15
      expect(schedules[1].id).toBe('schedule-b') // 2024-01-16  
      expect(schedules[2].id).toBe('schedule-c') // 2024-01-17
      expect(schedules[3].id).toBe('schedule-d') // 2024-01-18
    })

    it('getFocusSchedulesWithWorkflow should order by scheduled_time ASC', async () => {
      const schedules = await FocusScheduleRepo.getFocusSchedulesWithWorkflow()

      expect(schedules).toHaveLength(4)
      
      const scheduledTimes = schedules.map(s => s.scheduled_time)
      const sortedTimes = [...scheduledTimes].sort()
      
      expect(scheduledTimes).toEqual(sortedTimes)
    })
  })

  describe('JSON parsing transformation (recurrence_settings → recurrence)', () => {
    beforeEach(async () => {
      await testDb.execute(`
        INSERT INTO workflow (id, name, settings) 
        VALUES ('workflow-1', 'Test Workflow', '{}')
      `)

      await testDb.execute(`
        INSERT INTO focus_schedule (id, scheduled_time, workflow_id, is_active, recurrence_settings)
        VALUES 
          ('daily-schedule', '2024-01-15T09:00:00Z', 'workflow-1', 1, '{"type":"daily"}'),
          ('weekly-schedule', '2024-01-16T10:00:00Z', 'workflow-1', 1, '{"type":"weekly","daysOfWeek":[1,3,5]}'),
          ('no-recurrence', '2024-01-17T11:00:00Z', 'workflow-1', 1, NULL),
          ('empty-recurrence', '2024-01-18T12:00:00Z', 'workflow-1', 1, '')
      `)
    })

    it('getFocusSchedules should parse recurrence_settings JSON correctly', async () => {
      const schedules = await FocusScheduleRepo.getFocusSchedules()
      
      const dailySchedule = schedules.find(s => s.id === 'daily-schedule')!
      expect(dailySchedule.recurrence).toEqual({ type: 'daily' })
      
      const weeklySchedule = schedules.find(s => s.id === 'weekly-schedule')!
      expect(weeklySchedule.recurrence).toEqual({ 
        type: 'weekly', 
        daysOfWeek: [1, 3, 5] 
      })
      
      const noRecurrence = schedules.find(s => s.id === 'no-recurrence')!
      expect(noRecurrence.recurrence).toBeUndefined()
      
      const emptyRecurrence = schedules.find(s => s.id === 'empty-recurrence')!
      expect(emptyRecurrence.recurrence).toBeUndefined()
    })

    it('getFocusScheduleById should parse recurrence_settings JSON correctly', async () => {
      const schedule = await FocusScheduleRepo.getFocusScheduleById('weekly-schedule')
      
      expect(schedule!.recurrence).toEqual({
        type: 'weekly',
        daysOfWeek: [1, 3, 5]
      })
    })

    it('getFocusSchedulesWithWorkflow should parse recurrence_settings JSON correctly', async () => {
      const schedules = await FocusScheduleRepo.getFocusSchedulesWithWorkflow()
      
      const dailySchedule = schedules.find(s => s.id === 'daily-schedule')!
      expect(dailySchedule.recurrence).toEqual({ type: 'daily' })
    })
  })

  describe('JOIN transformation (adding workflow_name field)', () => {
    beforeEach(async () => {
      // Create multiple workflows
      await testDb.execute(`
        INSERT INTO workflow (id, name, settings) 
        VALUES 
          ('workflow-1', 'Deep Work', '{}'),
          ('workflow-2', 'Quick Tasks', '{}'),
          ('workflow-3', 'Meeting Prep', '{}')
      `)

      await testDb.execute(`
        INSERT INTO focus_schedule (id, scheduled_time, workflow_id, is_active)
        VALUES 
          ('schedule-1', '2024-01-15T09:00:00Z', 'workflow-1', 1),
          ('schedule-2', '2024-01-16T10:00:00Z', 'workflow-2', 1),
          ('schedule-orphan', '2024-01-17T11:00:00Z', 'non-existent-workflow', 1)
      `)
    })

    it('should add workflow_name field from JOIN', async () => {
      const schedules = await FocusScheduleRepo.getFocusSchedulesWithWorkflow()

      const schedule1 = schedules.find(s => s.id === 'schedule-1')!
      expect(schedule1.workflow_name).toBe('Deep Work')
      
      const schedule2 = schedules.find(s => s.id === 'schedule-2')!
      expect(schedule2.workflow_name).toBe('Quick Tasks')
    })

    it('should handle LEFT JOIN when workflow does not exist', async () => {
      const schedules = await FocusScheduleRepo.getFocusSchedulesWithWorkflow()

      const orphanSchedule = schedules.find(s => s.id === 'schedule-orphan')!
      expect(orphanSchedule).toBeDefined()
      expect(orphanSchedule.workflow_name).toBeNull() // LEFT JOIN returns NULL for missing workflow
    })

    it('should include all original focus_schedule fields plus workflow_name', async () => {
      const schedules = await FocusScheduleRepo.getFocusSchedulesWithWorkflow()
      
      expect(schedules.length).toBeGreaterThan(0)
      const schedule = schedules[0]
      
      // Original fields should be present
      expect(schedule).toHaveProperty('id')
      expect(schedule).toHaveProperty('scheduled_time')
      expect(schedule).toHaveProperty('workflow_id')
      expect(schedule).toHaveProperty('is_active')
      expect(schedule).toHaveProperty('created_at')
      expect(schedule).toHaveProperty('updated_at')
      
      // New joined field should be present
      expect(schedule).toHaveProperty('workflow_name')
    })
  })

  describe('soft delete behavior', () => {
    beforeEach(async () => {
      await testDb.execute(`
        INSERT INTO workflow (id, name, settings) 
        VALUES ('workflow-1', 'Test Workflow', '{}')
      `)

      await testDb.execute(`
        INSERT INTO focus_schedule (id, scheduled_time, workflow_id, is_active)
        VALUES ('schedule-to-delete', '2024-01-15T09:00:00Z', 'workflow-1', 1)
      `)
    })

    it('deleteFocusSchedule should set is_active to 0 instead of deleting', async () => {
      // Verify schedule exists and is active
      const beforeDelete = await FocusScheduleRepo.getFocusScheduleById('schedule-to-delete')
      expect(beforeDelete).toBeDefined()
      expect(beforeDelete!.is_active).toBe(1)

      // Delete the schedule
      const result = await FocusScheduleRepo.deleteFocusSchedule('schedule-to-delete')
      expect(result.rowsAffected).toBe(1)

      // Verify schedule still exists in database but is inactive
      const rawResult = await testDb.select<Array<{id: string, is_active: number}>>(
        'SELECT id, is_active FROM focus_schedule WHERE id = ?',
        ['schedule-to-delete']
      )
      
      expect(rawResult).toHaveLength(1)
      expect(rawResult[0].is_active).toBe(0) // Should be marked inactive

      // Verify it no longer appears in active queries
      const afterDelete = await FocusScheduleRepo.getFocusScheduleById('schedule-to-delete')
      expect(afterDelete).toBeUndefined()

      const allActive = await FocusScheduleRepo.getFocusSchedules()
      expect(allActive.find(s => s.id === 'schedule-to-delete')).toBeUndefined()
    })
  })

  describe('create and update operations', () => {
    beforeEach(async () => {
      await testDb.execute(`
        INSERT INTO workflow (id, name, settings) 
        VALUES ('workflow-1', 'Test Workflow', '{}')
      `)
    })

    it('createFocusSchedule should insert with generated UUID', async () => {
      const createData: CreateFocusSchedule = {
        id: 'will-be-overridden',
        scheduled_time: '2024-01-15T09:00:00Z',
        workflow_id: 'workflow-1',
        is_active: 1,
        recurrence_settings: '{"type":"daily"}'
      }

      const result = await FocusScheduleRepo.createFocusSchedule(createData)
      expect(result.rowsAffected).toBe(1)

      // Verify it was created with mocked UUID
      const created = await testDb.select<Array<{id: string}>>(
        'SELECT id FROM focus_schedule WHERE workflow_id = ?',
        ['workflow-1']
      )
      
      expect(created).toHaveLength(1)
      expect(created[0].id).toBe('test-uuid-123') // From our mock
    })

    it('updateFocusSchedule should update specified fields', async () => {
      // First create a schedule
      await testDb.execute(`
        INSERT INTO focus_schedule (id, scheduled_time, workflow_id, is_active, label)
        VALUES ('update-test', '2024-01-15T09:00:00Z', 'workflow-1', 1, 'Original Label')
      `)

      // Update only the label
      const result = await FocusScheduleRepo.updateFocusSchedule('update-test', {
        label: 'Updated Label'
      })
      expect(result.rowsAffected).toBe(1)

      // Verify the update
      const updated = await testDb.select<Array<{label: string, scheduled_time: string}>>(
        'SELECT label, scheduled_time FROM focus_schedule WHERE id = ?',
        ['update-test']
      )

      expect(updated[0].label).toBe('Updated Label')
      expect(updated[0].scheduled_time).toBe('2024-01-15T09:00:00Z') // Should be unchanged
    })
  })
})


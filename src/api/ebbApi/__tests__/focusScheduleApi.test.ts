import { describe, it, expect, vi, beforeEach } from 'vitest'
import { FocusScheduleApi, RecurrenceSettings } from '../focusScheduleApi'
import { FocusScheduleRepo } from '@/db/ebb/focusScheduleRepo'
import type { FocusSchedule } from '@/db/ebb/focusScheduleRepo'
import type { QueryResult } from '@tauri-apps/plugin-sql'
import { WorkflowApi } from '../workflowApi'
import type { Workflow } from '../workflowApi'

// Mock dependencies
vi.mock('@/db/ebb/focusScheduleRepo', () => ({
  FocusScheduleRepo: {
    createFocusSchedule: vi.fn(),
    updateFocusSchedule: vi.fn(),
    getFocusSchedules: vi.fn(),
    getFocusSchedulesWithWorkflow: vi.fn(),
    getFocusScheduleById: vi.fn(),
    deleteFocusSchedule: vi.fn(),
  },
}))

vi.mock('../workflowApi', () => ({
  WorkflowApi: {
    getWorkflowById: vi.fn(),
  },
}))

// Mock crypto.randomUUID for consistent test IDs
Object.defineProperty(globalThis, 'crypto', {
  value: {
    randomUUID: vi.fn(() => 'test-uuid-123'),
  },
})

describe('FocusScheduleApi', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // === PASSTHROUGH FUNCTIONS (Simple success tests) ===
  
  describe('getFocusSchedules', () => {
    it('should return schedules successfully', async () => {
      const mockSchedules: FocusSchedule[] = [{
        id: '1',
        label: 'Test',
        scheduled_time: '2024-01-15T09:00:00.000Z',
        workflow_id: 'workflow-1',
        is_active: 1,
        created_at: '2024-01-01T00:00:00.000Z',
        updated_at: '2024-01-01T00:00:00.000Z',
      }]
      vi.mocked(FocusScheduleRepo.getFocusSchedules).mockResolvedValue(mockSchedules)

      const result = await FocusScheduleApi.getFocusSchedules()

      expect(result).toBe(mockSchedules)
    })
  })

  describe('getFocusSchedulesWithWorkflow', () => {
    it('should return schedules with workflow successfully', async () => {
      const mockSchedules: (FocusSchedule & { workflow_name?: string })[] = [{
        id: '1',
        label: 'Test',
        scheduled_time: '2024-01-15T09:00:00.000Z',
        workflow_id: 'workflow-1',
        is_active: 1,
        created_at: '2024-01-01T00:00:00.000Z',
        updated_at: '2024-01-01T00:00:00.000Z',
        workflow_name: 'Deep Work'
      }]
      vi.mocked(FocusScheduleRepo.getFocusSchedulesWithWorkflow).mockResolvedValue(mockSchedules)

      const result = await FocusScheduleApi.getFocusSchedulesWithWorkflow()

      expect(result).toBe(mockSchedules)
    })
  })

  describe('getFocusScheduleById', () => {
    it('should return schedule by id successfully', async () => {
      const mockSchedule: FocusSchedule = {
        id: '1',
        label: 'Test',
        scheduled_time: '2024-01-15T09:00:00.000Z',
        workflow_id: 'workflow-1',
        is_active: 1,
        created_at: '2024-01-01T00:00:00.000Z',
        updated_at: '2024-01-01T00:00:00.000Z',
      }
      vi.mocked(FocusScheduleRepo.getFocusScheduleById).mockResolvedValue(mockSchedule)

      const result = await FocusScheduleApi.getFocusScheduleById('1')

      expect(result).toBe(mockSchedule)
    })
  })

  describe('deleteFocusSchedule', () => {
    it('should delete schedule successfully', async () => {
      const mockResult: QueryResult = { rowsAffected: 1 }
      vi.mocked(FocusScheduleRepo.deleteFocusSchedule).mockResolvedValue(mockResult)

      const result = await FocusScheduleApi.deleteFocusSchedule('1')

      expect(result).toBe(mockResult)
    })
  })

  // === BUSINESS LOGIC + DATA TRANSFORMATION FUNCTIONS ===

  describe('createFocusSchedule', () => {
    const mockWorkflow: Workflow = {
      id: 'workflow-1',
      name: 'Deep Work',
      selectedApps: [],
      settings: {
        typewriterMode: false,
        hasBreathing: false,
        hasMusic: false,
        defaultDuration: null,
      }
    }
    const mockScheduledTime = new Date('2024-01-15T09:00:00Z')
    const mockRecurrence: RecurrenceSettings = { type: 'daily' }

    beforeEach(() => {
      vi.mocked(WorkflowApi.getWorkflowById).mockResolvedValue(mockWorkflow)
      const mockResult: QueryResult = { rowsAffected: 1 }
      vi.mocked(FocusScheduleRepo.createFocusSchedule).mockResolvedValue(mockResult)
    })

    // Test business logic: workflow validation
    it('should throw error when workflow not found', async () => {
      vi.mocked(WorkflowApi.getWorkflowById).mockResolvedValue(null)

      await expect(
        FocusScheduleApi.createFocusSchedule('invalid-workflow', mockScheduledTime, mockRecurrence)
      ).rejects.toThrow('Workflow not found')
    })

    // Test data transformation: input parameters -> CreateFocusSchedule
    it('should transform parameters correctly with all fields', async () => {
      await FocusScheduleApi.createFocusSchedule(
        'workflow-1',
        mockScheduledTime,
        mockRecurrence,
        'Morning Focus'
      )

      expect(FocusScheduleRepo.createFocusSchedule).toHaveBeenCalledWith({
        id: 'test-uuid-123',
        label: 'Morning Focus',
        scheduled_time: '2024-01-15T09:00:00.000Z',
        workflow_id: 'workflow-1',
        recurrence_settings: '{"type":"daily"}',
        is_active: 1,
      })
    })

    it('should transform parameters correctly without optional label', async () => {
      await FocusScheduleApi.createFocusSchedule('workflow-1', mockScheduledTime, mockRecurrence)

      const call = vi.mocked(FocusScheduleRepo.createFocusSchedule).mock.calls[0][0]
      expect(call.label).toBeUndefined()
      expect(call.id).toBe('test-uuid-123')
      expect(call.is_active).toBe(1)
    })
  })

  describe('updateFocusSchedule', () => {
    beforeEach(() => {
      const mockResult: QueryResult = { rowsAffected: 1 }
      vi.mocked(FocusScheduleRepo.updateFocusSchedule).mockResolvedValue(mockResult)
    })

    // Test data transformation: update object -> partial CreateFocusSchedule
    it('should transform all update fields correctly', async () => {
      const updates = {
        label: 'New Label',
        workflowId: 'new-workflow',
        scheduledTime: new Date('2024-01-16T10:00:00Z'),
        recurrence: { type: 'weekly' as const, daysOfWeek: [1, 2, 3] }
      }

      await FocusScheduleApi.updateFocusSchedule('schedule-1', updates)

      expect(FocusScheduleRepo.updateFocusSchedule).toHaveBeenCalledWith('schedule-1', {
        label: 'New Label',
        workflow_id: 'new-workflow',
        scheduled_time: '2024-01-16T10:00:00.000Z',
        recurrence_settings: '{"type":"weekly","daysOfWeek":[1,2,3]}'
      })
    })

    it('should handle partial updates and undefined values', async () => {
      await FocusScheduleApi.updateFocusSchedule('schedule-1', { 
        label: undefined,
        workflowId: 'new-workflow'
      })

      expect(FocusScheduleRepo.updateFocusSchedule).toHaveBeenCalledWith('schedule-1', {
        label: undefined,
        workflow_id: 'new-workflow'
      })
    })
  })

  describe('formatScheduleDisplay', () => {
    const baseSchedule = {
      id: '1',
      scheduled_time: '2024-01-15T09:00:00Z', // 9 AM UTC
      workflow_id: 'workflow-1',
      is_active: 1,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z'
    }

    // Test business logic: different recurrence types
    it('should format one-time schedule (no recurrence)', () => {
      const schedule = { ...baseSchedule, recurrence: { type: 'none' as const } }
      
      const result = FocusScheduleApi.formatScheduleDisplay(schedule)
      
      expect(result).toMatch(/\d{1,2}\/\d{1,2}\/\d{4} at \d{1,2}:\d{2} (AM|PM)/)
    })

    it('should format daily recurring schedule', () => {
      const schedule = { ...baseSchedule, recurrence: { type: 'daily' as const } }
      
      const result = FocusScheduleApi.formatScheduleDisplay(schedule)
      
      expect(result).toMatch(/Daily at \d{1,2}:\d{2} (AM|PM)/)
    })

    it('should format single day weekly schedule', () => {
      const schedule = { ...baseSchedule, recurrence: { type: 'weekly' as const, daysOfWeek: [1] } }
      
      const result = FocusScheduleApi.formatScheduleDisplay(schedule)
      
      expect(result).toMatch(/Mon at \d{1,2}:\d{2} (AM|PM)/)
    })

    it('should format two day weekly schedule', () => {
      const schedule = { ...baseSchedule, recurrence: { type: 'weekly' as const, daysOfWeek: [1, 3] } }
      
      const result = FocusScheduleApi.formatScheduleDisplay(schedule)
      
      expect(result).toMatch(/Mon and Wed at \d{1,2}:\d{2} (AM|PM)/)
    })

    it('should format multi-day weekly schedule', () => {
      const schedule = { ...baseSchedule, recurrence: { type: 'weekly' as const, daysOfWeek: [1, 2, 3, 4, 5] } }
      
      const result = FocusScheduleApi.formatScheduleDisplay(schedule)
      
      expect(result).toMatch(/Mon, Tue, Wed, Thu, and Fri at \d{1,2}:\d{2} (AM|PM)/)
    })

    it('should handle edge cases gracefully', () => {
      // Empty days array
      const invalidSchedule = { ...baseSchedule, recurrence: { type: 'weekly' as const, daysOfWeek: [] } }
      expect(FocusScheduleApi.formatScheduleDisplay(invalidSchedule)).toBe('Invalid schedule')

      // No recurrence property
      const noRecurrence = { ...baseSchedule }
      expect(FocusScheduleApi.formatScheduleDisplay(noRecurrence)).toMatch(/\d{1,2}\/\d{1,2}\/\d{4} at \d{1,2}:\d{2} (AM|PM)/)
    })
  })
})

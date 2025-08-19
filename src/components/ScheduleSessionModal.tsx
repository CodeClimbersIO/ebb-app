import { useState, useEffect } from 'react'
import { AnalyticsButton } from '@/components/ui/analytics-button'
import { DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useCreateFocusSchedule, useUpdateFocusSchedule, useFocusScheduleById } from '@/api/hooks/useFocusSchedule'
import { useGetWorkflows } from '@/api/hooks/useWorkflow'
import { RecurrenceSettings } from '@/api/ebbApi/focusScheduleApi'
import { cn } from '@/lib/utils/tailwind.util'
import { Workflow } from '@/api/ebbApi/workflowApi'
import { NoAnalyticsButton } from './ui/no-analytics-button'

interface ScheduleSessionModalProps {
  scheduleId?: string
  onClose: () => void
}

const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export function ScheduleSessionModal({ scheduleId, onClose }: ScheduleSessionModalProps) {
  const [label, setLabel] = useState('')
  const [selectedWorkflowId, setSelectedWorkflowId] = useState('')
  const [recurrenceType, setRecurrenceType] = useState<'daily' | 'weekly'>('weekly')
  const [selectedDays, setSelectedDays] = useState<number[]>([1]) // Default to Monday
  const [time, setTime] = useState('11:00')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const { data: workflows } = useGetWorkflows()
  const { data: existingSchedule } = useFocusScheduleById(scheduleId || '')
  const { mutateAsync: createFocusSchedule } = useCreateFocusSchedule()
  const { mutateAsync: updateFocusSchedule } = useUpdateFocusSchedule()

  // Load existing schedule data for editing
  useEffect(() => {
    if (existingSchedule) {
      setLabel(existingSchedule.label || '')
      setSelectedWorkflowId(existingSchedule.workflow_id)
      
      const scheduledDate = new Date(existingSchedule.scheduled_time)
      const timeString = scheduledDate.toLocaleTimeString('en-US', { 
        hour12: false, 
        hour: '2-digit', 
        minute: '2-digit' 
      })
      setTime(timeString)
      
      if (existingSchedule.recurrence) {
        setRecurrenceType(existingSchedule.recurrence.type as 'daily' | 'weekly')
        if (existingSchedule.recurrence.daysOfWeek) {
          setSelectedDays(existingSchedule.recurrence.daysOfWeek)
        }
      }
    }
  }, [existingSchedule])

  // Set default workflow if none selected
  useEffect(() => {
    if (!selectedWorkflowId && workflows && workflows.length > 0) {
      setSelectedWorkflowId(workflows[0].id || '')
    }
  }, [workflows, selectedWorkflowId])

  const handleDayToggle = (dayIndex: number) => {
    setSelectedDays(prev => 
      prev.includes(dayIndex)
        ? prev.filter(d => d !== dayIndex)
        : [...prev, dayIndex].sort()
    )
  }

  const handleSubmit = async () => {
    if (!selectedWorkflowId || selectedDays.length === 0) return

    setIsSubmitting(true)
    
    try {
      // Create a date object for the scheduled time (using next occurrence of first selected day)
      const now = new Date()
      const [hours, minutes] = time.split(':').map(Number)
      
      const scheduledDate = new Date(now)
      scheduledDate.setHours(hours, minutes, 0, 0)
      
      // If it's for weekly recurrence, set to next occurrence of the first selected day
      if (recurrenceType === 'weekly') {
        const targetDay = selectedDays[0]
        const currentDay = now.getDay()
        const daysUntilTarget = (targetDay - currentDay + 7) % 7
        scheduledDate.setDate(now.getDate() + (daysUntilTarget === 0 ? 7 : daysUntilTarget))
      }

      const recurrence: RecurrenceSettings = {
        type: recurrenceType,
        ...(recurrenceType === 'weekly' && { daysOfWeek: selectedDays })
      }

      if (scheduleId) {
        await updateFocusSchedule({
          id: scheduleId,
          updates: {
            label: label || undefined,
            workflowId: selectedWorkflowId,
            scheduledTime: scheduledDate,
            recurrence,
          }
        })
      } else {
        await createFocusSchedule({
          label: label || undefined,
          workflowId: selectedWorkflowId,
          scheduledTime: scheduledDate,
          recurrence,
        })
      }
      
      onClose()
    } catch (error) {
      console.error('Failed to save focus schedule:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <label htmlFor="label" className="text-sm font-medium">Label (optional)</label>
        <Input
          id="label"
          placeholder="e.g., Morning Deep Work"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="workflow" className="text-sm font-medium">Focus Session Workflow</label>
        <Select value={selectedWorkflowId} onValueChange={setSelectedWorkflowId}>
          <SelectTrigger>
            <SelectValue placeholder="Select a workflow" />
          </SelectTrigger>
          <SelectContent>
            {workflows?.map((workflow: Workflow) => (
              <SelectItem key={workflow.id} value={workflow.id || ''}>
                {workflow.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-4">
        <label className="text-sm font-medium">Recurrence</label>
        <div className="flex gap-2">
          <NoAnalyticsButton
            type="button"
            variant={recurrenceType === 'daily' ? 'default' : 'outline'}
            size="sm"
            onClick={() => {
              setRecurrenceType('daily')
              setSelectedDays([1, 2, 3, 4, 5, 6, 0]) // All days for daily
            }}
          >
            Daily
          </NoAnalyticsButton>
          <NoAnalyticsButton
            type="button"
            variant={recurrenceType === 'weekly' ? 'default' : 'outline'}
            size="sm"
            onClick={() => {
              setRecurrenceType('weekly')
              setSelectedDays([1]) // Default to Monday
            }}
          >
            Weekly
          </NoAnalyticsButton>
        </div>

        {recurrenceType === 'weekly' && (
          <div className="space-y-2">
            <label className="text-sm font-medium">Select Days</label>
            <div className="flex gap-1">
              {dayNames.map((day, index) => (
                <NoAnalyticsButton
                  key={day}
                  type="button"
                  variant={selectedDays.includes(index) ? 'default' : 'outline'}
                  size="sm"
                  className={cn('w-12 h-12 p-0')}
                  onClick={() => handleDayToggle(index)}
                >
                  {day}
                </NoAnalyticsButton>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="space-y-2">
        <label htmlFor="time" className="text-sm font-medium">Time</label>
        <Input
          id="time"
          type="time"
          value={time}
          onChange={(e) => setTime(e.target.value)}
        />
      </div>

      <DialogFooter>
        <NoAnalyticsButton
          variant="outline"
          onClick={onClose}
          disabled={isSubmitting}
        >
          Cancel
        </NoAnalyticsButton>
        <AnalyticsButton
          analyticsEvent={scheduleId ? 'schedule_session_modal_updated' : 'schedule_session_modal_created'}
          onClick={handleSubmit}
          disabled={isSubmitting || !selectedWorkflowId || selectedDays.length === 0}
        >
          {isSubmitting ? 'Saving...' : scheduleId ? 'Update Schedule' : 'Create Schedule'}
        </AnalyticsButton>
      </DialogFooter>
    </div>
  )
}

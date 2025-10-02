import { type FC, useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { AnalyticsButton } from '@/components/ui/analytics-button'
import { useGetTideTemplates, useUpdateTideTemplate, useGetActiveTides, useUpdateTide } from '@/api/hooks/useTides'
import { Skeleton } from '@/components/ui/skeleton'
import { TimeSelector } from '@/components/TimeSelector'
import { toast } from 'sonner'
import { TideTemplate } from '@/api/ebbApi/tideApi'

interface TideEditDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

interface TemplateEdit {
  id: string
  goal_amount: number
  metrics_type: string
  days_of_week: number[]
  tide_frequency: string
}

interface TideTemplateItemProps {
  edit: TemplateEdit
  onUpdate: (templateId: string, updates: Partial<TemplateEdit>) => void
}

const TideTemplateItem: FC<TideTemplateItemProps> = ({ edit, onUpdate }) => {
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  return (
    <div className="space-y-3 p-3 border rounded-lg">
      <div className="flex items-center justify-between">
        <h3 className="font-medium capitalize">
          {edit.tide_frequency} Tide
        </h3>
      </div>

      {/* Goal Amount */}
      <div className="space-y-2">
        <TimeSelector
          value={edit.goal_amount || null}
          onChange={(minutes) => onUpdate(edit.id, { goal_amount: minutes || 0 })}
          presets={
            edit.tide_frequency === 'daily'
              ? [
                { value: '60', label: '1 hour' },
                { value: '120', label: '2 hours' },
                { value: '180', label: '3 hours' },
                { value: '240', label: '4 hours' }
              ]
              : [
                { value: '600', label: '10 hours' },
                { value: '900', label: '15 hours' },
                { value: '1200', label: '20 hours' },
                { value: '1500', label: '25 hours' }
              ]
          }
        />
      </div>

      {/* Days of Week (only for daily templates) */}
      {edit.tide_frequency === 'daily' && (
        <div className="space-y-2">
          <span className="text-sm font-medium">Days of Week</span>
          <div className="flex space-x-1">
            {dayNames.map((day, index) => (
              <button
                key={day}
                onClick={() => {
                  const currentDays = edit.days_of_week
                  const newDays = currentDays.includes(index)
                    ? currentDays.filter(d => d !== index)
                    : [...currentDays, index].sort((a, b) => a - b)
                  onUpdate(edit.id, { days_of_week: newDays })
                }}
                className={`px-2 py-1 text-xs rounded-full transition-colors ${edit.days_of_week.includes(index)
                  ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}
              >
                {day}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export const TideEditDialog: FC<TideEditDialogProps> = ({
  open,
  onOpenChange
}) => {
  const { data: templates, isLoading } = useGetTideTemplates()
  const { data: activeTides } = useGetActiveTides()
  const updateTemplateMutation = useUpdateTideTemplate()
  const updateTideMutation = useUpdateTide()
  const [editedTemplates, setEditedTemplates] = useState<TemplateEdit[]>([])

  // Initialize edited templates when templates load
  useEffect(() => {
    if (templates && templates.length > 0) {
      const initialEdits: TemplateEdit[] = templates.map(template => ({
        id: template.id,
        goal_amount: template.goal_amount,
        metrics_type: template.metrics_type,
        days_of_week: template.day_of_week ? template.day_of_week.split(',').map(Number) : [1, 2, 3, 4, 5], // Default weekdays
        tide_frequency: template.tide_frequency
      }))
      setEditedTemplates(initialEdits)
    }
  }, [templates])

  const handleSave = async () => {
    try {
      const updatePromises = []

      // Update each modified template
      for (const editedTemplate of editedTemplates) {
        const originalTemplate = templates?.find(t => t.id === editedTemplate.id)
        if (!originalTemplate) continue

        const hasChanges =
          originalTemplate.goal_amount !== editedTemplate.goal_amount ||
          originalTemplate.day_of_week !== editedTemplate.days_of_week.join(',')

        if (hasChanges) {
          const templateUpdate = {
            goal_amount: editedTemplate.goal_amount,
            day_of_week: editedTemplate.days_of_week.length > 0 ? editedTemplate.days_of_week.join(',') : undefined
          }

          updatePromises.push(
            updateTemplateMutation.mutateAsync({
              id: editedTemplate.id,
              updates: templateUpdate
            })
          )

          // Update any active tides using this template
          const activeTidesForTemplate = activeTides?.filter(tide =>
            tide.tide_template_id === editedTemplate.id
          )

          if (activeTidesForTemplate && activeTidesForTemplate.length > 0) {
            for (const activeTide of activeTidesForTemplate) {
              // Only update the goal amount if it changed, preserve actual progress
              if (originalTemplate.goal_amount !== editedTemplate.goal_amount) {
                updatePromises.push(
                  updateTideMutation.mutateAsync({
                    id: activeTide.id,
                    updates: {
                      goal_amount: editedTemplate.goal_amount
                    }
                  })
                )
              }
            }
          }
        }
      }

      if (updatePromises.length > 0) {
        await Promise.all(updatePromises)
        toast.success('Tide updated successfully')
      }

      onOpenChange(false)
    } catch (error) {
      console.error('Failed to save tide:', error)
      toast.error('Failed to save tide. Please try again.')
    }
  }

  const updateTemplate = (templateId: string, updates: Partial<TemplateEdit>) => {
    setEditedTemplates(prev =>
      prev.map(t => t.id === templateId ? { ...t, ...updates } : t)
    )
  }

  if (isLoading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Tide Templates</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit Tides</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4 max-h-80 overflow-y-auto">
          {editedTemplates.map(edit => (
            <TideTemplateItem
              key={edit.id}
              edit={edit}
              onUpdate={updateTemplate}
            />
          ))}
        </div>

        <div className="flex justify-end space-x-2">
          <AnalyticsButton
            variant="outline"
            onClick={() => onOpenChange(false)}
            analyticsEvent="get_pro_clicked"
          >
            Cancel
          </AnalyticsButton>
          <AnalyticsButton
            onClick={handleSave}
            analyticsEvent="get_pro_clicked"
            disabled={updateTemplateMutation.isPending || updateTideMutation.isPending}
          >
            {updateTemplateMutation.isPending || updateTideMutation.isPending ? 'Saving...' : 'Save Templates'}
          </AnalyticsButton>
        </div>
      </DialogContent>
    </Dialog>
  )
}

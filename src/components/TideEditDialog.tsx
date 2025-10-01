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

interface TideEditDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

interface TemplateEdit {
  id: string
  goalMinutes: number // Total minutes for the goal
  metricsType: string
  daysOfWeek: number[] // For daily templates
}

export const TideEditDialog: FC<TideEditDialogProps> = ({
  open,
  onOpenChange
}) => {
  const { data: templates, isLoading } = useGetTideTemplates()
  const { data: activeTides } = useGetActiveTides()
  const updateTemplateMutation = useUpdateTideTemplate()
  const updateTideMutation = useUpdateTide()
  const [editedTemplates, setEditedTemplates] = useState<Record<string, TemplateEdit>>({})

  // Initialize edited templates when templates load
  useEffect(() => {
    if (templates && templates.length > 0) {
      const initialEdits: Record<string, TemplateEdit> = {}
      templates.forEach(template => {
        initialEdits[template.id] = {
          id: template.id,
          goalMinutes: template.goal_amount,
          metricsType: template.metrics_type,
          daysOfWeek: template.day_of_week ? template.day_of_week.split(',').map(Number) : [1,2,3,4,5] // Default weekdays
        }
      })
      setEditedTemplates(initialEdits)
    }
  }, [templates])

  const handleSave = async () => {
    try {
      const updatePromises = []

      // Update each modified template
      for (const [templateId, editedTemplate] of Object.entries(editedTemplates)) {
        const originalTemplate = templates?.find(t => t.id === templateId)
        if (!originalTemplate) continue

        const hasChanges =
          originalTemplate.goal_amount !== editedTemplate.goalMinutes ||
          originalTemplate.day_of_week !== editedTemplate.daysOfWeek.join(',')

        if (hasChanges) {
          const templateUpdate = {
            goal_amount: editedTemplate.goalMinutes,
            day_of_week: editedTemplate.daysOfWeek.length > 0 ? editedTemplate.daysOfWeek.join(',') : undefined
          }

          updatePromises.push(
            updateTemplateMutation.mutateAsync({
              id: templateId,
              updates: templateUpdate
            })
          )

          // Update any active tides using this template
          const activeTidesForTemplate = activeTides?.filter(tide =>
            tide.tide_template_id === templateId
          )

          if (activeTidesForTemplate && activeTidesForTemplate.length > 0) {
            for (const activeTide of activeTidesForTemplate) {
              // Only update the goal amount if it changed, preserve actual progress
              if (originalTemplate.goal_amount !== editedTemplate.goalMinutes) {
                updatePromises.push(
                  updateTideMutation.mutateAsync({
                    id: activeTide.id,
                    updates: {
                      goal_amount: editedTemplate.goalMinutes
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
        toast.success('Tide templates updated successfully')
      }

      onOpenChange(false)
    } catch (error) {
      console.error('Failed to save tide templates:', error)
      toast.error('Failed to save tide templates. Please try again.')
    }
  }

  const updateTemplate = (templateId: string, updates: Partial<TemplateEdit>) => {
    setEditedTemplates(prev => ({
      ...prev,
      [templateId]: { ...prev[templateId], ...updates }
    }))
  }


  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

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
          {templates?.map(template => {
            const edit = editedTemplates[template.id]
            if (!edit) return null

            return (
              <div key={template.id} className="space-y-3 p-3 border rounded-lg">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium capitalize">
                    {template.tide_frequency} Tide
                  </h3>
                </div>

                {/* Goal Amount */}
                <div className="space-y-2">
                  <TimeSelector
                    value={edit.goalMinutes || null}
                    onChange={(minutes) => updateTemplate(template.id, { goalMinutes: minutes || 0 })}
                    presets={
                      template.tide_frequency === 'daily'
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
                {template.tide_frequency === 'daily' && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Days of Week</label>
                    <div className="flex space-x-1">
                      {dayNames.map((day, index) => (
                        <button
                          key={index}
                          onClick={() => {
                            const currentDays = edit.daysOfWeek
                            const newDays = currentDays.includes(index)
                              ? currentDays.filter(d => d !== index)
                              : [...currentDays, index].sort()
                            updateTemplate(template.id, { daysOfWeek: newDays })
                          }}
                          className={`px-2 py-1 text-xs rounded-full transition-colors ${
                            edit.daysOfWeek.includes(index)
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-muted text-muted-foreground hover:bg-muted/80'
                          }`}
                        >
                          {day}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
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

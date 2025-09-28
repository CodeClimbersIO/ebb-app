import { type FC, useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { AnalyticsButton } from '@/components/ui/analytics-button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface TideEditDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  tideType: 'daily' | 'weekly'
  currentGoal?: number // in minutes
  metricsType?: string
}

export const TideEditDialog: FC<TideEditDialogProps> = ({
  open,
  onOpenChange,
  tideType,
  currentGoal = 0,
  metricsType = 'creating'
}) => {
  const [goalHours, setGoalHours] = useState(Math.floor(currentGoal / 60))
  const [goalMinutes, setGoalMinutes] = useState(currentGoal % 60)
  const [selectedMetrics, setSelectedMetrics] = useState(metricsType)

  const handleSave = () => {
    const totalMinutes = goalHours * 60 + goalMinutes
    console.log('Saving tide:', { tideType, totalMinutes, selectedMetrics })
    // TODO: Implement actual save logic using TideApi
    onOpenChange(false)
  }

  const formatTime = (hours: number, minutes: number) => {
    if (hours === 0 && minutes === 0) return '0m'
    if (hours === 0) return `${minutes}m`
    if (minutes === 0) return `${hours}h`
    return `${hours}h ${minutes}m`
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {currentGoal > 0 ? 'Edit' : 'Create'} {tideType} tide goal
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Goal Amount */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Goal Amount</label>
            <div className="flex items-center space-x-2">
              <div className="flex items-center space-x-1">
                <Input
                  type="number"
                  min="0"
                  max="23"
                  value={goalHours}
                  onChange={(e) => setGoalHours(parseInt(e.target.value) || 0)}
                  className="w-16"
                />
                <span className="text-sm text-muted-foreground">h</span>
              </div>
              <div className="flex items-center space-x-1">
                <Input
                  type="number"
                  min="0"
                  max="59"
                  step="15"
                  value={goalMinutes}
                  onChange={(e) => setGoalMinutes(parseInt(e.target.value) || 0)}
                  className="w-16"
                />
                <span className="text-sm text-muted-foreground">m</span>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              Goal: {formatTime(goalHours, goalMinutes)}
            </p>
          </div>

          {/* Metrics Type */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Activity Type</label>
            <Select value={selectedMetrics} onValueChange={setSelectedMetrics}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="creating">Creating</SelectItem>
                <SelectItem value="neutral">Neutral</SelectItem>
                <SelectItem value="consuming">Consuming</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Quick Presets */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Quick Presets</label>
            <div className="flex space-x-2">
              <AnalyticsButton
                variant="outline"
                size="sm"
                onClick={() => { setGoalHours(1); setGoalMinutes(0) }}
                analyticsEvent="get_pro_clicked"
              >
                1h
              </AnalyticsButton>
              <AnalyticsButton
                variant="outline"
                size="sm"
                onClick={() => { setGoalHours(2); setGoalMinutes(0) }}
                analyticsEvent="get_pro_clicked"
              >
                2h
              </AnalyticsButton>
              <AnalyticsButton
                variant="outline"
                size="sm"
                onClick={() => { setGoalHours(4); setGoalMinutes(0) }}
                analyticsEvent="get_pro_clicked"
              >
                4h
              </AnalyticsButton>
              <AnalyticsButton
                variant="outline"
                size="sm"
                onClick={() => { setGoalHours(0); setGoalMinutes(0) }}
                analyticsEvent="get_pro_clicked"
              >
                No Goal
              </AnalyticsButton>
            </div>
          </div>
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
          >
            Save Tide
          </AnalyticsButton>
        </div>
      </DialogContent>
    </Dialog>
  )
}

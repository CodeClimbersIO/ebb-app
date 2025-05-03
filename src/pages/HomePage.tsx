import { Layout } from '@/components/Layout'
import { useNavigate } from 'react-router-dom'
import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { ChevronDown } from 'lucide-react'
import { FlowSessionApi } from '../api/ebbApi/flowSessionApi'
import { DateTime } from 'luxon'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { useAuth } from '../hooks/useAuth'
import { UsageSummary } from '@/components/UsageSummary'
import { PermissionAlert } from '@/components/PermissionAlert'
import { useUsageSummary } from './useUsageSummary'

export const HomePage = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const firstName = user?.user_metadata?.full_name?.split(' ')[0] ||
    user?.user_metadata?.name?.split(' ')[0] ||
    user?.email?.split('@')[0]

  const {
    date,
    setDate,
    rangeMode,
    setRangeMode,
    appUsage,
    totalCreating,
    totalTime,
    chartData,
    tags,
    isLoading,
    handleRatingChange,
    yAxisMax,
  } = useUsageSummary()

  useEffect(() => {
    const init = async () => {
      const flowSession = await FlowSessionApi.getInProgressFlowSession()
      if (flowSession) {
        navigate('/flow')
      }
    }
    init()
  }, [navigate])

  return (
    <Layout>
      <div className="p-8">
        <div className="max-w-5xl mx-auto">
          <PermissionAlert />
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold">
                {firstName ? `Welcome, ${firstName}` : 'Welcome'}
              </h1>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
                <Button
                  variant={rangeMode === 'day' ? 'default' : 'ghost'}
                  size="sm"
                  className="px-3 py-1 text-xs font-medium rounded-lg"
                  onClick={() => setRangeMode('day')}
                >
                  Day
                </Button>
                <Button
                  variant={rangeMode === 'week' ? 'default' : 'ghost'}
                  size="sm"
                  className="px-3 py-1 text-xs font-medium rounded-lg"
                  onClick={() => setRangeMode('week')}
                >
                  Week
                </Button>
              </div>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="justify-start text-left font-normal"
                  >
                    <div className="flex items-center gap-2">
                      {date.toLocaleDateString() === new Date().toLocaleDateString()
                        ? 'Today'
                        : DateTime.fromJSDate(date).toFormat('LLL dd, yyyy')}
                      <ChevronDown className="h-4 w-4" />
                    </div>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={(newDate) => {
                      if (newDate) {
                        setDate(newDate)
                      }
                    }}
                    disabled={(date) => date > new Date()}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
          <UsageSummary
            totalTimeLabel="Total Time"
            totalTimeTooltip={rangeMode === 'day' ? 'Total time spent online today' : 'Total time spent online this week'}
            totalTime={totalTime}
            totalCreating={totalCreating}
            chartData={chartData}
            appUsage={appUsage}
            showTopAppsButton={true}
            showAppRatingControls={true}
            onRatingChange={handleRatingChange}
            tags={tags}
            isLoading={isLoading}
            yAxisMax={yAxisMax}
          />
        </div>
      </div>
    </Layout>
  )
}

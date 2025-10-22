import { Layout } from '@/components/Layout'
import { AnalyticsButton } from '@/components/ui/analytics-button'
import { ChevronDown } from 'lucide-react'
import { DateTime } from 'luxon'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { useAuth } from '@/hooks/useAuth'
import { UsageSummary } from '@/components/UsageSummary'
import { UsageSummaryWithTides } from '@/components/UsageSummaryWithTides'
import { PermissionAlert } from '@/components/PermissionAlert'
import { useUsageSummary } from './useUsageSummary'
import { RangeModeSelector } from '@/components/RangeModeSelector'
import { isTideGoalsFeatureEnabled } from '@/lib/utils/environment.util'
import { useUsageSummaryStore } from '@/lib/stores/usageSummaryStore'
import { usePurchaseConfetti } from '@/hooks/usePurchaseConfetti'

export const HomePage = () => {
  const { user } = useAuth()
  const date = useUsageSummaryStore((state) => state.date)
  const setDate = useUsageSummaryStore((state) => state.setDate)
  const rangeMode = useUsageSummaryStore((state) => state.rangeMode)
  const setRangeMode = useUsageSummaryStore((state) => state.setRangeMode)

  const firstName = user?.user_metadata?.full_name?.split(' ')[0] ||
    user?.user_metadata?.name?.split(' ')[0] ||
    user?.email?.split('@')[0]

  const {
    appUsage,
    chartData,
    isLoading,
    yAxisMax,
    showIdleTime,
    setShowIdleTime,
    lastUpdated,
    totalCreating,
    totalTime,
    totalTimeTooltip,
    totalTimeLabel,
  } = useUsageSummary()

  const isTideGoalsEnabled = isTideGoalsFeatureEnabled(user?.email)

  // Celebrate successful purchases with confetti
  usePurchaseConfetti()


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
              <RangeModeSelector value={rangeMode} onChange={setRangeMode} />
              <Popover>
                <PopoverTrigger asChild>
                  <AnalyticsButton
                    variant="outline"
                    className="justify-start text-left font-normal"
                    analyticsEvent="date_picker_clicked"
                    analyticsProperties={{
                      destination: 'date_picker',
                      source: 'homepage'
                    }}
                  >
                    <div className="flex items-center gap-2">
                      {date.toLocaleDateString() === new Date().toLocaleDateString()
                        ? 'Today'
                        : DateTime.fromJSDate(date).toFormat('LLL dd, yyyy')}
                      <ChevronDown className="h-4 w-4" />
                    </div>
                  </AnalyticsButton>
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
          {isTideGoalsEnabled ? (
            <UsageSummaryWithTides
              chartData={chartData || []}
              appUsage={appUsage || []}
              isLoading={isLoading}
              yAxisMax={yAxisMax}
              showIdleTime={showIdleTime}
              setShowIdleTime={setShowIdleTime}
              lastUpdated={lastUpdated}
              totalTime={totalTime}
            />
          ) : (
            <UsageSummary
              totalTimeLabel={totalTimeLabel}
              totalTimeTooltip={totalTimeTooltip}
              totalTime={totalTime}
              totalCreating={totalCreating}
              chartData={chartData || []}
              appUsage={appUsage || []}
              showTopAppsButton={true}
              showIdleTime={showIdleTime}
              setShowIdleTime={setShowIdleTime}
              isLoading={isLoading}
              yAxisMax={yAxisMax}
              lastUpdated={lastUpdated}
            />
          )}
        </div>
      </div>
    </Layout>
  )
}

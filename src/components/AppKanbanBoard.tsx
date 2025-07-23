import { DndContext } from '@dnd-kit/core'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { ColumnWrapper } from './ColumnWrapper'
import { useKanbanBoard } from '../api/hooks/useKanbanBoard'

interface AppKanbanBoardProps {
  rangeMode: 'day' | 'week' | 'month'
  date: Date
}

export function AppKanbanBoard({ rangeMode, date }: AppKanbanBoardProps) {
  // Use our new hook instead of managing state directly
  const {
    columns,
    totalAppUsage,
    handleDragStart,
    handleDragEnd,
    isLoading,
    error,
  } = useKanbanBoard({ rangeMode, date })

  if (error) {
    return <div>Error loading data</div>
  }

  return (
    <DndContext onDragEnd={handleDragEnd} onDragStart={handleDragStart}>
      <Card className="mt-4">
        <CardHeader>
          <CardTitle>App/Website Usage</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-[200px] w-full" />
          ) : (
            <div className="grid grid-cols-3 gap-4">
              <ColumnWrapper
                id="creation"
                title="Creation"
                titleClassName="text-md text-[rgb(124,58,237)]"
                apps={columns.creation}
                totalAppUsage={totalAppUsage}
              />
              <ColumnWrapper
                id="neutral"
                title="Neutral"
                titleClassName="text-md text-gray-500"
                apps={columns.neutral}
                totalAppUsage={totalAppUsage}
              />
              <ColumnWrapper
                id="consumption"
                title="Consumption"
                titleClassName="text-md text-[rgb(239,68,68)]"
                apps={columns.consumption}
                totalAppUsage={totalAppUsage}
              />
            </div>
          )}
        </CardContent>
      </Card>
    </DndContext>
  )
}

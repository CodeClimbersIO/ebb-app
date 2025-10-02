import { useDroppable } from '@dnd-kit/core'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { DraggableAppCard } from './DraggableAppCard'
import { AppsWithTime } from '../api/monitorApi/monitorApi'
import { formatTime } from '@/components/UsageSummary'


type ColumnWrapperProps = {
  id: string; 
  title: string; 
  titleClassName?: string;
  apps: AppsWithTime[]; 
  categoryUsage: number;
};

export function ColumnWrapper({
  id,
  title,
  titleClassName,
  apps,
  categoryUsage,
}: ColumnWrapperProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: id,
  })

  const ColumnColour = id === 'creation' ? 'bg-[rgb(124,58,237)]' : id === 'neutral' ? 'bg-gray-500' : 'bg-[rgb(239,68,68)]'

  const highlightClass = isOver ? `bg-${ColumnColour}/10 border-${ColumnColour}` : 'bg-muted/20 border-transparent'

  return (
  // Attach setNodeRef to the root element of the column
    <Card className={`p-4 border ${highlightClass} transition-colors duration-200`} ref={setNodeRef}>
      <CardHeader className="p-0 mb-4 flex flex-row items-center justify-between">
        <CardTitle className={titleClassName}>{title}</CardTitle>
        <span className="text-sm text-muted-foreground font-medium">
          {formatTime(categoryUsage)}
        </span>
      </CardHeader>
      <CardContent className="p-0 space-y-4 min-h-[100px]"> {/* min-h to prevent collapse when empty */}
        {apps.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-4">
            {isOver ? 'Drop app here' : 'Drag apps here'}
          </p>
        )}
        {apps
          .filter(app => app.duration >= 1) // Keep filtering logic for display
          .map((app) => (
            <DraggableAppCard
              key={app.id}
              app={app}
              totalCategoryUsage={categoryUsage} 
            />
          ))}
      </CardContent>
    </Card>
  )
}



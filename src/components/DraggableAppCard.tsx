import { useDraggable } from '@dnd-kit/core'
import { AppIcon } from './AppIcon' 
import { Progress } from './ui/progress'
import { formatTime } from '@/components/UsageSummary' 
import { AppsWithTime } from '../api/monitorApi/monitorApi' 
import { cn } from '@/lib/utils/tailwind.util'

type DraggableAppCardProps = {
    app: AppsWithTime;
    totalCategoryUsage: number;
}

export function DraggableAppCard({ 
  app, 
  totalCategoryUsage, 
}: DraggableAppCardProps) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: app.id,
    data: {
      app: app
    }
  })
    
  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
    transition: 'transform 0.1s ease-out',
    zIndex: 100,
  } : undefined

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={cn(
        'flex items-center p-4 gap-4 rounded-lg',
        'cursor-grab',
        'bg-card border border-border',
        'shadow-sm hover:shadow transition-all duration-200',
        'dark:bg-gray-900 dark:border-gray-800',
        'hover:bg-accent/5 dark:hover:bg-gray-800/50'
      )}
      style={style}
    >
      <div className={cn(
        'rounded-md',
        'bg-muted dark:bg-gray-700',
        'p-1'
      )}>
        <AppIcon app={app} size="md"/>
      </div>
      <div className="flex-1 min-w-0"> {/* min-w-0 helps with text truncation */}
        <div className="flex items-center justify-between mb-1 gap-2">
          <span className={cn(
            'text-sm font-medium truncate',
            'text-foreground dark:text-gray-100'
          )}>
            {app.is_browser ? app.app_external_id : app.name}
          </span>
          <span className={cn(
            'text-sm whitespace-nowrap',
            'text-muted-foreground dark:text-gray-400'
          )}>
            {formatTime(app.duration)}
          </span>
        </div>
        <Progress
          value={(app.duration / totalCategoryUsage) * 100}
          className={cn(
            app.rating >= 4 && 'bg-[rgb(124,58,237)]/10 [&>div]:bg-[rgb(124,58,237)]',
            app.rating <= 2 && 'bg-[rgb(239,68,68)]/10 [&>div]:bg-[rgb(239,68,68)]',
            app.rating === 3 && 'bg-gray-500/10 [&>div]:bg-gray-500'
          )}
        />
      </div>
    </div>
  )
}

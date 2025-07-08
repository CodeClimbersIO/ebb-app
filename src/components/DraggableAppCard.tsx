import { useDraggable } from '@dnd-kit/core';
import { AppIcon } from './AppIcon'; 
import { Progress } from './ui/progress';
import { formatTime }  from '@/components/UsageSummary'; 
import { AppsWithTime } from '../api/monitorApi/monitorApi'; 
import { ActivityRating } from '@/lib/app-directory/apps-types'
import { Tag } from '../db/monitor/tagRepo'; 


type DraggableAppCardProps = {
    app: AppsWithTime;
    totalAppUsage: number;
    showAppRatingControls?: boolean;
    onRatingChange?: (tagId: string, rating: ActivityRating, tags: Tag[]) => void;
    tags?: Tag[]; 
}

export function DraggableAppCard({ 
    app, 
    totalAppUsage, 
    }: DraggableAppCardProps) {

    const { attributes, listeners, setNodeRef, transform } = useDraggable({
        id: app.id
    });

    // Apply the transform style to visually move the item while dragging
    const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
    transition: 'transform 0.1s ease-out',
    zIndex: 100,
  } : undefined;

  return (
    // Attach setNodeRef, listeners, and attributes to the root draggable element
    // Apply the style for visual transformation
    <div
        ref={setNodeRef}
        {...listeners}
        {...attributes}
        className="flex items-center gap-4 py-2 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200"
        style={style}>
            <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
        <AppIcon app={app} size="md" />
      </div>
      <div className="flex-1">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-1">
            <span className="font-medium">{app.is_browser ? app.app_external_id : app.name}</span>
          </div>
          <span className="text-sm text-muted-foreground">
            {formatTime(app.duration)}
          </span>
        </div>
        <Progress
          value={(app.duration / totalAppUsage) * 100}
          className={
            app.rating >= 4
              ? 'bg-[rgb(124,58,237)]/20 [&>div]:bg-[rgb(124,58,237)]' :
              app.rating <= 2
                ? 'bg-[rgb(239,68,68)]/20 [&>div]:bg-[rgb(239,68,68)]' :
                'bg-gray-500/20 [&>div]:bg-gray-500'
          }
        />
      </div>
    </div>

  )
}

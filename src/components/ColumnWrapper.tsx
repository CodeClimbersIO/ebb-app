import { useDroppable } from '@dnd-kit/core';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { DraggableAppCard } from './DraggableAppCard';
import { AppsWithTime } from '../api/monitorApi/monitorApi';
import { ActivityRating } from '@/lib/app-directory/apps-types'; 
import { Tag } from '../db/monitor/tagRepo'; 


type ColumnWrapperProps = {
  id: string; 
  title: string; 
  apps: AppsWithTime[]; 
  totalAppUsage: number;
  showAppRatingControls: boolean;
  onRatingChange?: (tagId: string, rating: ActivityRating, tags: Tag[]) => void;
  tags?: Tag[];
};

export function ColumnWrapper({
  id,
  title,
  apps,
  totalAppUsage,
  showAppRatingControls = false,
  onRatingChange,
  tags = [],
}: ColumnWrapperProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: id,
  });

  const highlightClass = isOver ? 'bg-primary/10 border-primary' : 'bg-muted/20 border-transparent';

  return (
     // Attach setNodeRef to the root element of the column
    <Card className={`p-4 border ${highlightClass} transition-colors duration-200`} ref={setNodeRef}>
      <CardHeader className="p-0 mb-4 flex flex-row items-center justify-between">
        <CardTitle className="text-lg">{title}</CardTitle>
        <span className="text-sm text-muted-foreground">{apps.length} apps</span>
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
              totalAppUsage={totalAppUsage}
              showAppRatingControls={showAppRatingControls}
              onRatingChange={onRatingChange}
              tags={tags}
            />
          ))}
      </CardContent>
    </Card>
  );
}



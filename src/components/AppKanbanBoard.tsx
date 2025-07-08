import { useState, useEffect, useRef } from 'react';
import { DndContext, DragEndEvent, DragStartEvent } from '@dnd-kit/core';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ColumnWrapper } from './ColumnWrapper';
// Import types if using TypeScript
import { AppsWithTime } from '../api/monitorApi/monitorApi';
import { ActivityRating } from '@/lib/app-directory/apps-types';
import { Tag } from '../db/monitor/tagRepo';

// --- Type Definitions for Kanban Board ---
type ColumnId = 'creation' | 'neutral' | 'consumption';

interface KanbanColumns {
  creation: AppsWithTime[];
  neutral: AppsWithTime[];
  consumption: AppsWithTime[];
}
// --- END Type Definitions ---

// Define props for the AppKanbanBoard component
interface AppKanbanBoardProps {
  initialAppUsage: AppsWithTime[]; // The initial flat array of apps
  showAppRatingControls?: boolean;
  onRatingChange?: (tagId: string, rating: ActivityRating, tags: Tag[]) => void;
  tags?: Tag[];
  isLoading?: boolean;
}

export function AppKanbanBoard({
  initialAppUsage,
  showAppRatingControls = false,
  onRatingChange,
  tags = [],
  isLoading = false,
}: AppKanbanBoardProps) {
  // State for Kanban Board Columns
  const [columns, setColumns] = useState<KanbanColumns>({
    'creation': [],
    'neutral': [],
    'consumption': [],
  });

  // Calculate totalAppUsage from the columns state for progress bar within cards
  const totalAppUsage = Object.values(columns).flat().reduce((acc: number, app: AppsWithTime) => acc + app.duration, 0);

  // State to track the source column during drag for efficiency
  const [activeDragSourceColumnId, setActiveDragSourceColumnId] = useState<ColumnId | null>(null);

  // Flag to track if columns have been initialized from initialAppUsage
  const isInitialized = useRef(false);

  // useEffect to populate columns when initialAppUsage changes
  useEffect(() => {
    if (initialAppUsage.length > 0 && !isInitialized.current) {
      const newColumns: KanbanColumns = {
        'creation': [],
        'neutral': [],
        'consumption': [],
      };

      initialAppUsage.forEach((app: AppsWithTime) => {
        if (app.duration >= 1) {
          if (app.rating >= 4) {
            newColumns['creation'].push(app);
          } else if (app.rating === 3) {
            newColumns['neutral'].push(app);
          } else if (app.rating <= 2) {
            newColumns['consumption'].push(app);
          }
        }
      });
      setColumns(newColumns);
      isInitialized.current = true;
    } else if (initialAppUsage.length > 0 && isInitialized.current) {
    }
  }, [initialAppUsage]);


  // handleDragStart function for DND Kit
  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    // Find which column the active item belongs to when drag starts
    for (const columnId in columns) {
      if (columns[columnId as ColumnId].some((app: AppsWithTime) => app.id === active.id)) {
        setActiveDragSourceColumnId(columnId as ColumnId);
        break;
      }
    }
  };

  // handleDragEnd function for DND Kit
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    // Reset active drag source column ID
    setActiveDragSourceColumnId(null);

    // Guard: If dropped outside any valid droppable area
    if (!over) {
      return;
    }

    const draggedAppId = active.id;
    const targetColumnId = over.id as ColumnId; // Cast over.id to ColumnId

    // --- NEW GUARD: If dropped into the same column it came from ---
    if (activeDragSourceColumnId && activeDragSourceColumnId === targetColumnId) {
      return; // Do nothing if dropped back into the same column
    }
    // --- END NEW GUARD ---

    setColumns((prevColumns: KanbanColumns) => {
      const newColumns = { ...prevColumns };

      let draggedApp: AppsWithTime | null = null;

      // Find and remove the app from its source column
      // We rely on activeDragSourceColumnId being set correctly in handleDragStart
      if (activeDragSourceColumnId && newColumns[activeDragSourceColumnId]) {
        const appsInSourceColumn = newColumns[activeDragSourceColumnId];
        const appIndex = appsInSourceColumn.findIndex((app: AppsWithTime) => app.id === draggedAppId);

        if (appIndex !== -1) {
          draggedApp = appsInSourceColumn[appIndex];
          newColumns[activeDragSourceColumnId] = appsInSourceColumn.filter((app: AppsWithTime) => app.id !== draggedAppId);
        } else {
            // Fallback: This case should ideally not happen if activeDragSourceColumnId is reliable
            for (const colId in newColumns) {
                const foundIndex = newColumns[colId as ColumnId].findIndex((app: AppsWithTime) => app.id === draggedAppId);
                if (foundIndex !== -1) {
                    draggedApp = newColumns[colId as ColumnId][foundIndex];
                    newColumns[colId as ColumnId] = newColumns[colId as ColumnId].filter((app: AppsWithTime) => app.id !== draggedAppId);
                    break;
                }
            }
        }
      } else {
          // Fallback: This means activeDragSourceColumnId was null or invalid, which is unexpected
          for (const colId in newColumns) {
              const foundIndex = newColumns[colId as ColumnId].findIndex((app: AppsWithTime) => app.id === draggedAppId);
              if (foundIndex !== -1) {
                  draggedApp = newColumns[colId as ColumnId][foundIndex];
                  newColumns[colId as ColumnId] = newColumns[colId as ColumnId].filter((app: AppsWithTime) => app.id !== draggedAppId);
                  console.warn(`Drag End: App ${draggedAppId} found and removed from ${colId} as a fallback (activeDragSourceColumnId was missing).`); // Log
                  break;
              }
          }
      }


      // Add the app to the target column (only if it's not already there by ID)
      if (draggedApp && newColumns[targetColumnId]) {
        // --- NEW GUARD: Check if the app is ALREADY in the target column to prevent duplicates ---
        const isAlreadyInTarget = newColumns[targetColumnId].some(app => app.id === draggedAppId);

        if (!isAlreadyInTarget) {
          let newRating: ActivityRating;

          if (targetColumnId === 'creation') {
            newRating = draggedApp.rating >= 4 ? draggedApp.rating : 4; // Keep 5 if already 5, otherwise set to 4
          } else if (targetColumnId === 'neutral') {
            newRating = 3;
          } else { // targetColumnId === 'consumption'
            newRating = draggedApp.rating <= 2 ? draggedApp.rating : 2; // Keep 1 if already 1, otherwise set to 2
          }

          const updatedDraggedApp = { ...draggedApp, rating: newRating };
          newColumns[targetColumnId].push(updatedDraggedApp);

          if (onRatingChange && updatedDraggedApp.default_tag) {
            onRatingChange(updatedDraggedApp.default_tag.id, newRating, tags);
          }
        } else {
        }
      } else if (!draggedApp) {
          console.error(`Drag End: Could not find dragged app ${draggedAppId} in any column.`); 
      } else {
          console.error(`Drag End: Target column ${targetColumnId} is invalid or not found.`); 
      }

      return newColumns;
    });
  };

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
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
              <ColumnWrapper
                id="creation"
                title="Creation"
                titleClassName="text-sm text-[rgb(124,58,237)]"
                apps={columns.creation}
                totalAppUsage={totalAppUsage}
                showAppRatingControls={showAppRatingControls}
                onRatingChange={onRatingChange}
                tags={tags}
              />
              <ColumnWrapper
                id="neutral"
                title="Neutral"
                titleClassName="text-sm text-gray-500"
                apps={columns.neutral}
                totalAppUsage={totalAppUsage}
                showAppRatingControls={showAppRatingControls}
                onRatingChange={onRatingChange}
                tags={tags}
              />
              <ColumnWrapper
                id="consumption"
                title="Consumption"
                titleClassName="text-sm text-[rgb(239,68,68)]"
                apps={columns.consumption}
                totalAppUsage={totalAppUsage}
                showAppRatingControls={showAppRatingControls}
                onRatingChange={onRatingChange}
                tags={tags}
              />
            </div>
          )}
        </CardContent>
      </Card>
    </DndContext>
  );
}

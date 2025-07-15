// hooks/useAppUsage.ts
import { useState, useEffect, useRef } from 'react'
import { DragEndEvent, DragStartEvent } from '@dnd-kit/core'
import { AppsWithTime } from '@/api/monitorApi/monitorApi' // Adjust path as needed for types
import { ActivityRating } from '@/lib/app-directory/apps-types' // Adjust path as needed for types
import { useAppUsage, useTags, useUpdateAppRatingMutation } from '@/api/hooks/useAppUsage'


// --- Type Definitions for Kanban Board ---
type tagName = 'creation' | 'neutral' | 'consumption';

interface KanbanColumns {
  creation: AppsWithTime[];
  neutral: AppsWithTime[];
  consumption: AppsWithTime[];
}



export const useKanbanBoard = () => {
  const { data: fetchedAppUsage, isLoading: isLoadingAppUsage, error: appUsageError } = useAppUsage()

  const { data: fetchedTags, isLoading: isLoadingTags, error: tagsError } = useTags()

  const updateAppRatingMutation = useUpdateAppRatingMutation()

  const updateRating = (tagId: string, rating: ActivityRating) => {
    updateAppRatingMutation.mutate({ tagId, rating })
  }

  // State for Kanban Board Columns
  const [columns, setColumns] = useState<KanbanColumns>({
    'creation': [],
    'neutral': [],
    'consumption': [],
  })

  // Calculate totalAppUsage from the columns state for progress bar within cards
  const totalAppUsage = Object.values(columns).flat().reduce((acc: number, app: AppsWithTime) => acc + app.duration, 0)

  // State to track the source column during drag for efficiency
  const [activeDragSourceTagId, setActiveDragSourceTagId] = useState<string | null>(null)

  // Flag to track if columns have been initialized from appUsage
  const isInitialized = useRef(false)

  // useEffect to populate columns when fetchedAppUsage changes (i.e., when data loads)
  useEffect(() => {
    // MODIFIED: Now depends on fetchedAppUsage from useQuery
    if (fetchedAppUsage && fetchedAppUsage.length > 0 && !isInitialized.current) {
      const newColumns: KanbanColumns = {
        'creation': [],
        'neutral': [],
        'consumption': [],
      }

      fetchedAppUsage.forEach((app: AppsWithTime) => {
        if (app.duration >= 1) {
          if (app.rating >= 4) {
            newColumns['creation'].push(app)
          } else if (app.rating === 3) {
            newColumns['neutral'].push(app)
          } else if (app.rating <= 2) {
            newColumns['consumption'].push(app)
          }
        }
      })
      setColumns(newColumns)
      isInitialized.current = true
    } else if (fetchedAppUsage && fetchedAppUsage.length > 0 && isInitialized.current) {
      console.log('useAppUsage: fetchedAppU xsage changed but columns already initialized. Not re-initializing.')
    }
  }, [fetchedAppUsage]) // MODIFIED: Dependency is now fetchedAppUsage


  // handleDragStart function for DND Kit
  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event
    for (const tagId in columns) {
      if (columns[tagId as tagName].some((app: AppsWithTime) => app.id === active.id)) {
        setActiveDragSourceTagId(tagId as tagName)
        break
      }
    }
  }

  // handleDragEnd function for DND Kit
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    setActiveDragSourceTagId(null);

    if (!over) {
      return;
    }

    const draggedAppId = active.id;
    const targetTagId = over.id as tagName;

    // If dropped back into the same column, do nothing
    if (activeDragSourceTagId && activeDragSourceTagId === targetTagId) {
      return;
    }

    setColumns((prevColumns: KanbanColumns) => {
      const newColumns = { ...prevColumns }; // Create a shallow copy of the columns object

      let draggedApp: AppsWithTime | null = null;
      let sourceTagId: tagName | null = null;

      // Find the dragged app and its actual source column by iterating through all columns
      for (const colId of Object.keys(newColumns) as tagName[]) {
        const foundApp = newColumns[colId].find((app: AppsWithTime) => app.id === draggedAppId);
        if (foundApp) {
          draggedApp = foundApp;
          sourceTagId = colId;
          break;
        }
      }

      // If the dragged app is not found or source column is unknown, return previous state
      if (!draggedApp || !sourceTagId) {
        return prevColumns;
      }

      // Remove the app from its source column (immutably)
      newColumns[sourceTagId] = newColumns[sourceTagId].filter((app: AppsWithTime) => app.id !== draggedAppId);

      // Check if the target column is valid
      if (!newColumns[targetTagId]) {
        return prevColumns; // Return previous state if target column is invalid
      }

      // Check if the app is already in the target column to prevent duplicates (should ideally not happen with proper DND, but as a safeguard)
      const isAlreadyInTarget = newColumns[targetTagId].some(app => app.id === draggedAppId);
      if (isAlreadyInTarget) {
        return newColumns; // Return the state after removal, but before adding
      }

      // Determine the new rating based on the target column
      let newRating: ActivityRating;
      if (targetTagId === 'creation') {
        newRating = draggedApp.rating >= 4 ? draggedApp.rating : 4;
      } else if (targetTagId === 'neutral') {
        newRating = 3;
      } else { // consumption
        newRating = draggedApp.rating <= 2 ? draggedApp.rating : 2;
      }

      // Create an updated version of the dragged app with the new rating
      const updatedDraggedApp = { ...draggedApp, rating: newRating };

      // Add the updated app to the target column (immutably)
      newColumns[targetTagId] = [...newColumns[targetTagId], updatedDraggedApp];

      // Trigger the mutation to persist the rating change to the backend
      if (updatedDraggedApp.default_tag) {
        updateRating(updatedDraggedApp.default_tag.id, newRating);
      } else {
      }

      return newColumns;
    });
  };

  // Return the necessary state and handlers
  return {
    columns,
    totalAppUsage,
    appUsage: fetchedAppUsage || [],
    handleDragStart,
    handleDragEnd,
    isLoading: isLoadingAppUsage || isLoadingTags, // Overall loading state
    error: appUsageError || tagsError, // Overall error state
    updateRating,
    tags: fetchedTags ?? [],
  }
}

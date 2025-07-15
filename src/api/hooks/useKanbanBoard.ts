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
  const [activeDragSourceColumnId, setActiveDragSourceColumnId] = useState<tagName | null>(null)

  // Flag to track if columns have been initialized from appUsage
  const isInitialized = useRef(false)

  // useEffect to populate columns when fetchedAppUsage changes (i.e., when data loads)
  useEffect(() => {
    // MODIFIED: Now depends on fetchedAppUsage from useQuery
    if (fetchedAppUsage && fetchedAppUsage.length > 0 && !isInitialized.current) {
      console.log('useAppUsage: Initializing columns from fetchedAppUsage:', fetchedAppUsage)
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
      console.log('useAppUsage: fetchedAppUsage changed but columns already initialized. Not re-initializing.')
      // Optional: If you want to resync the Kanban board with fresh data from the API
      // without losing user's current drag state, you'd need more complex merge logic here.
      // For simplicity, we're currently preventing re-initialization if already initialized.
    }
  }, [fetchedAppUsage]) // MODIFIED: Dependency is now fetchedAppUsage


  // handleDragStart function for DND Kit
  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event
    console.log('Drag Start: Active item ID:', active.id)
    for (const columnId in columns) {
      if (columns[columnId as tagName].some((app: AppsWithTime) => app.id === active.id)) {
        setActiveDragSourceColumnId(columnId as tagName)
        console.log('Drag Start: Source Column ID:', columnId)
        break
      }
    }
  }

  // handleDragEnd function for DND Kit
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    // Reset active drag source column ID
    setActiveDragSourceColumnId(null)

    if (!over) {
      console.log('Drag End: Dropped outside valid area. No action.')
      return
    }

    const draggedAppId = active.id
    const targetColumnId = over.id as tagName
    console.log('Drag End: Dragged ID:', draggedAppId, 'Dropped Over Column ID:', targetColumnId)

    if (activeDragSourceColumnId && activeDragSourceColumnId === targetColumnId) {
      console.log(`Drag End: App ${draggedAppId} dropped back into its original column ${targetColumnId}. No state change.`)
      return
    }

    setColumns((prevColumns: KanbanColumns) => {
      console.log('Drag End: (Inside setColumns) Previous Columns State:', JSON.parse(JSON.stringify(prevColumns)))
      const newColumns = { ...prevColumns }

      let draggedApp: AppsWithTime | null = null

      if (activeDragSourceColumnId && newColumns[activeDragSourceColumnId]) {
        const appsInSourceColumn = newColumns[activeDragSourceColumnId]
        const appIndex = appsInSourceColumn.findIndex((app: AppsWithTime) => app.id === draggedAppId)

        if (appIndex !== -1) {
          draggedApp = appsInSourceColumn[appIndex]
          newColumns[activeDragSourceColumnId] = appsInSourceColumn.filter((app: AppsWithTime) => app.id !== draggedAppId)
          console.log(`Drag End: App ${draggedAppId} removed from source column ${activeDragSourceColumnId}.`)
        } else {
          console.warn(`Drag End: App ${draggedAppId} not found in recorded source column ${activeDragSourceColumnId}. Searching all columns as fallback.`)
          for (const colId in newColumns) {
            const foundIndex = newColumns[colId as tagName].findIndex((app: AppsWithTime) => app.id === draggedAppId)
            if (foundIndex !== -1) {
              draggedApp = newColumns[colId as tagName][foundIndex]
              newColumns[colId as tagName] = newColumns[colId as tagName].filter((app: AppsWithTime) => app.id !== draggedAppId)
              console.warn(`Drag End: App ${draggedAppId} found and removed from ${colId} as a fallback.`)
              break
            }
          }
        }
      } else {
        console.error(`Drag End: activeDragSourceColumnId was null or invalid: ${activeDragSourceColumnId}. Cannot determine source column efficiently. Searching all columns.`)
        for (const colId in newColumns) {
          const foundIndex = newColumns[colId as tagName].findIndex((app: AppsWithTime) => app.id === draggedAppId)
          if (foundIndex !== -1) {
            draggedApp = newColumns[colId as tagName][foundIndex]
            console.warn(`Drag End: App ${draggedAppId} found and removed from ${colId} as a fallback (activeDragSourceColumnId was missing).`)
            break
          }
        }
      }

      if (draggedApp && newColumns[targetColumnId]) {
        const isAlreadyInTarget = newColumns[targetColumnId].some(app => app.id === draggedAppId)

        if (!isAlreadyInTarget) {
          let newRating: ActivityRating

          if (targetColumnId === 'creation') {
            newRating = draggedApp.rating >= 4 ? draggedApp.rating : 4
          } else if (targetColumnId === 'neutral') {
            newRating = 3
          } else {
            newRating = draggedApp.rating <= 2 ? draggedApp.rating : 2
          }

          const updatedDraggedApp = { ...draggedApp, rating: newRating }
          newColumns[targetColumnId].push(updatedDraggedApp)
          console.log(`Drag End: App ${draggedAppId} added to target column ${targetColumnId} with new rating ${newRating}.`)

          // NEW: Call the mutation to persist the rating change
          if (updatedDraggedApp.default_tag) {
            updateRating(updatedDraggedApp.default_tag.id, newRating)
            console.log(`Drag End: Triggered mutation for ${draggedAppId} with rating ${newRating}.`)
          } else {
            console.warn(`App ${draggedAppId} has no default_tag. Rating change not persisted.`)
          }
        } else {
          console.warn(`Drag End: App ${draggedAppId} is already present in target column ${targetColumnId}. Skipping add to prevent duplicate.`)
        }
      } else if (!draggedApp) {
        console.error(`Drag End: Could not find dragged app ${draggedAppId} in any column.`)
      } else {
        console.error(`Drag End: Target column ${targetColumnId} is invalid or not found.`)
      }

      console.log('Drag End: (Inside setColumns) New Columns State (before return):', JSON.parse(JSON.stringify(newColumns)))
      return newColumns
    })
  }

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

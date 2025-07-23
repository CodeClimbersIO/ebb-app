// hooks/useAppUsage.ts
import { useState, useEffect } from 'react'
import { DragEndEvent } from '@dnd-kit/core'
import { AppsWithTime } from '@/api/monitorApi/monitorApi' // Adjust path as needed for types
import { ActivityRating } from '@/lib/app-directory/apps-types' // Adjust path as needed for types
import { useAppUsage, useTags, useUpdateAppRatingMutation } from '@/api/hooks/useAppUsage'


// --- Type Definitions for Kanban Board ---
type tagName = 'creating' | 'neutral' | 'consuming';

interface KanbanColumns {
  creating: AppsWithTime[];
  neutral: AppsWithTime[];
  consuming: AppsWithTime[];
}



export const useKanbanBoard = ({ rangeMode, date }: { rangeMode: 'day' | 'week' | 'month', date: Date }) => {
  const { data: fetchedAppUsage, isLoading: isLoadingAppUsage, error: appUsageError } = useAppUsage({ rangeMode, date })

  const { data: fetchedTags, isLoading: isLoadingTags, error: tagsError } = useTags()

  const updateAppRatingMutation = useUpdateAppRatingMutation()

  // State for Kanban Board Columns
  const [columns, setColumns] = useState<KanbanColumns>({
    'creating': [],
    'neutral': [],
    'consuming': [],
  })

  // Calculate totalAppUsage from the columns state for progress bar within cards
  const totalAppUsage = Object.values(columns).flat().reduce((acc: number, app: AppsWithTime) => acc + app.duration, 0)

  // Flag to track if columns have been initialized from appUsage

  // useEffect to populate columns when fetchedAppUsage changes (i.e., when data loads)
  useEffect(() => {
    // Reset initialization flag when date or rangeMode changes
  }, [date, rangeMode])

  useEffect(() => {
    // MODIFIED: Now depends on fetchedAppUsage from useQuery
    if (fetchedAppUsage && fetchedAppUsage.length > 0) {
      const newColumns: KanbanColumns = {
        'creating': [],
        'neutral': [],
        'consuming': [],
      }

      fetchedAppUsage.forEach((app: AppsWithTime) => {
        if (app.default_tag) {
          const tagName = app.default_tag.tag_name as tagName
          newColumns[tagName].push(app)
        }
      })
      setColumns(newColumns)
    }
  }, [fetchedAppUsage])


  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    // If the app is dropped outside the valid area, do nothing
    if (!over) {
      return
    }

    const currentColumnId = active.data.current?.app.default_tag?.tag_name as tagName 

    const targetColumnId = over.id as tagName

    // If the app is dropped back into the same column, do nothing
    if (currentColumnId && currentColumnId === targetColumnId) {
      return
    }

    // get the category of the new column
    const newCategory = targetColumnId as tagName
    let rating = 3

    if(newCategory === 'creating') {
      rating = 4
    } else if(newCategory === 'consuming') {
      rating = 2
    }
    const appTagId = active.data.current?.app.default_tag?.id as string
    setColumns(prevColumns => {
      const updatedColumns = { ...prevColumns }
      const app = active.data.current?.app
      if (app && currentColumnId) {
        updatedColumns[currentColumnId] = updatedColumns[currentColumnId].filter(item => item.id !== app.id)
        updatedColumns[targetColumnId].push(app)
        updatedColumns[targetColumnId].sort((a, b) => b.duration - a.duration)
      }
      return updatedColumns
    })
    updateAppRatingMutation.mutate({ appTagId, rating: rating as ActivityRating })


  }

  // Return the necessary state and handlers
  return {
    columns,
    totalAppUsage,
    appUsage: fetchedAppUsage || [],
    handleDragEnd,
    isLoading: isLoadingAppUsage || isLoadingTags, // Overall loading state
    error: appUsageError || tagsError, // Overall error state
    tags: fetchedTags ?? [],
  }
}

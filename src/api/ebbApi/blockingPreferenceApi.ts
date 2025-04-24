import { SearchOption } from '@/components/AppSelector'
import { BlockingPreferenceRepo, BlockingPreferenceDb } from '@/db/ebb/blockingPreferenceRepo'
import { AppRepo } from '@/db/monitor/appRepo'
import { TagRepo } from '@/db/monitor/tagRepo'
import { AppCategory } from '../../lib/app-directory/apps-types'

const saveWorkflowBlockingPreferences = async (
  workflowId: string,
  blocks: SearchOption[],
): Promise<void> => {
  const preferences: Partial<BlockingPreferenceDb>[] = []
  for (const block of blocks) {
    if (block.type === 'app') {
      preferences.push({
        id: crypto.randomUUID(),
        app_id: block.app.id,
        workflow_id: workflowId
      })
    } else if (block.type === 'category') {
      if (block.tag?.id) {
        preferences.push({
          id: crypto.randomUUID(),
          tag_id: block.tag.id,
          workflow_id: workflowId
        })
      }
    }
  }
  
  await BlockingPreferenceRepo.saveWorkflowBlockingPreferences(workflowId, preferences)
}

const getWorkflowBlockingPreferencesAsSearchOptions = async (workflowId: string): Promise<SearchOption[]> => {
  const { preferences } = await BlockingPreferenceRepo.getWorkflowBlockingPreferences(workflowId)
  return await convertToSearchOptions(preferences)
}

const convertToSearchOptions = async (
  preferences: BlockingPreferenceDb[]
): Promise<SearchOption[]> => {
  // Group IDs
  const appIds: string[] = []
  const tagIds: string[] = []
  
  for (const pref of preferences) {
    if (pref.app_id) appIds.push(pref.app_id)
    if (pref.tag_id) tagIds.push(pref.tag_id)
  }
  
  const [apps, categories] = await Promise.all([
    AppRepo.getAppsByIds(appIds),
    TagRepo.getCategoriesWithAppCounts(tagIds)
  ])
  
  const appMap = new Map(apps.map(app => [app.id, app]))
  const categoryMap = new Map(categories.map(cat => [cat.id, cat]))
  
  const searchOptions: SearchOption[] = []
  
  for (const pref of preferences) {
    if (pref.app_id && appMap.has(pref.app_id)) {
      searchOptions.push({
        type: 'app',
        app: appMap.get(pref.app_id)!
      })
    } else if (pref.tag_id && categoryMap.has(pref.tag_id)) {
      const category = categoryMap.get(pref.tag_id)!
      searchOptions.push({
        type: 'category',
        tag: category,
        category: category.name as AppCategory,
        count: category.count
      })
    }
  }
  
  return searchOptions
}

export const BlockingPreferenceApi = {
  getWorkflowBlockingPreferencesAsSearchOptions,
  saveWorkflowBlockingPreferences,
}


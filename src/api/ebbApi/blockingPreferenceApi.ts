import { SearchOption } from '@/components/AppSelector'
import { BlockingPreferenceRepo, BlockingPreferenceDb } from '@/db/ebb/blockingPreferenceRepo'
import { App, AppRepo } from '@/db/monitor/appRepo'
import { TagRepo } from '@/db/monitor/tagRepo'
import { AppCategory } from '../../lib/app-directory/apps-types'


const saveBlockingPreferences = async (
  blocks: SearchOption[],
): Promise<void> => {
  const preferences: Partial<BlockingPreferenceDb>[] = []
  for (const block of blocks) {
    if (block.type === 'app') {
      preferences.push({
        id: crypto.randomUUID(),
        app_id: block.app.id,
      })
    } else if (block.type === 'category') {
      if (block.tag?.id) {
        preferences.push({
          id: crypto.randomUUID(),
          tag_id: block.tag.id,
        })
      }
    }
  }
  await BlockingPreferenceRepo.saveBlockingPreferences(preferences)
}

const getBlockingPreferencesAsSearchOptions = async (): Promise<SearchOption[]> => {
  const { preferences } = await BlockingPreferenceRepo.getBlockingPreferences()
  return await convertToSearchOptions(preferences)
}

const getAllBlockedApps = async (): Promise<App[]> => {
  const { preferences } = await BlockingPreferenceRepo.getBlockingPreferences()
  // get all app ids from preferences
  const prefAppIds = preferences
    .filter(pref => pref.app_id)
    .map(pref => pref.app_id as string)
  const prefTagIds = preferences
    .filter(pref => pref.tag_id)
    .map(pref => pref.tag_id as string)

  // get all apps that belong to the tags of type category
  const categoryApps = await AppRepo.getAppsByCategoryTags(prefTagIds)
  const apps = await AppRepo.getAppsByIds([...prefAppIds])
  return [...apps, ...categoryApps]
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
  getBlockingPreferencesAsSearchOptions,
  saveBlockingPreferences,
  getAllBlockedApps
}


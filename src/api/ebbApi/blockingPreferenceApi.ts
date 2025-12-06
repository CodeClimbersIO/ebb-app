import { SearchOption } from '@/components/AppSelector'
import { BlockingPreferenceRepo, BlockingPreferenceDb } from '@/db/ebb/blockingPreferenceRepo'
import { AppRepo, App } from '@/db/monitor/appRepo'
import { TagRepo } from '@/db/monitor/tagRepo'
import { AppCategory } from '@/lib/app-directory/apps-types'
import type { Tag, TagWithAppCount } from '@/db/monitor/tagRepo'

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

interface BlockingAppConfig {
  external_id: string | null
  is_browser: boolean
}

const getWorkflowBlockedApps = async (workflowId: string): Promise<BlockingAppConfig[]> => {
  const selectedApps = await getWorkflowBlockingPreferencesAsSearchOptions(workflowId)

  const directAppSelections: App[] = selectedApps
    .filter((option): option is Extract<SearchOption, { type: 'app' }> => option.type === 'app' && !!option.app)
    .map(option => option.app)

  const categorySelections: Tag[] = selectedApps
    .filter((option): option is Extract<SearchOption, { type: 'category' }> => option.type === 'category' && !!option.tag)
    .map(option => option.tag)

  const categoryTagIds = categorySelections.map(tag => tag.id).filter(id => !!id) as string[]

  const appsFromCategories = categoryTagIds.length > 0
    ? await AppRepo.getAppsByCategoryTags(categoryTagIds)
    : []

  const allAppsToConsider = [...directAppSelections, ...appsFromCategories]

  const uniqueAppsMap = new Map<string, App>()
  allAppsToConsider.forEach(app => {
    if (app && app.id) {
      uniqueAppsMap.set(app.id, app)
    }
  })
  const uniqueApps = Array.from(uniqueAppsMap.values())

  const blockingAppConfig = uniqueApps.map((app: App) => ({
    external_id: app.app_external_id,
    is_browser: app.is_browser === 1
  }))

  return blockingAppConfig
}

const getDefaultSearchOptions = async (): Promise<SearchOption[]> => {
  const defaultCategoryNames = ['social media', 'entertainment']
  const allCategoryTags = await TagRepo.getTagsByType('category')
  const defaultTags = allCategoryTags.filter((tag: Tag) =>
    defaultCategoryNames.includes(tag.name)
  )
  const defaultTagIds = defaultTags.map((tag: Tag) => tag.id).filter((id): id is string => !!id)

  let defaultSearchOptions: SearchOption[] = []
  if (defaultTagIds.length > 0) {
    const categoriesWithCounts = await TagRepo.getCategoriesWithAppCounts(defaultTagIds)
    defaultSearchOptions = categoriesWithCounts.map((catInfo: TagWithAppCount): SearchOption => ({
      type: 'category',
      tag: catInfo,
      category: catInfo.name as AppCategory,
      count: catInfo.count
    }))
  }
  return defaultSearchOptions
}

interface BlockingAnalyticsData {
  blocked_apps_count: number
  blocked_websites_count: number
  total_blocked_count: number
  blocked_app_names: string[]
  blocked_website_names: string[]
}

const getWorkflowBlockedAppsAnalytics = async (workflowId: string): Promise<BlockingAnalyticsData> => {
  const selectedApps = await getWorkflowBlockingPreferencesAsSearchOptions(workflowId)

  const directAppSelections: App[] = selectedApps
    .filter((option): option is Extract<SearchOption, { type: 'app' }> => option.type === 'app' && !!option.app)
    .map(option => option.app)

  const categorySelections: Tag[] = selectedApps
    .filter((option): option is Extract<SearchOption, { type: 'category' }> => option.type === 'category' && !!option.tag)
    .map(option => option.tag)

  const categoryTagIds = categorySelections.map(tag => tag.id).filter(id => !!id) as string[]

  const appsFromCategories = categoryTagIds.length > 0
    ? await AppRepo.getAppsByCategoryTags(categoryTagIds)
    : []

  const allAppsToConsider = [...directAppSelections, ...appsFromCategories]

  const uniqueAppsMap = new Map<string, App>()
  allAppsToConsider.forEach(app => {
    if (app && app.id) {
      uniqueAppsMap.set(app.id, app)
    }
  })
  const uniqueApps = Array.from(uniqueAppsMap.values())

  const apps = uniqueApps.filter(app => !app.is_browser)
  const websites = uniqueApps.filter(app => app.is_browser)

  return {
    blocked_apps_count: apps.length,
    blocked_websites_count: websites.length,
    total_blocked_count: uniqueApps.length,
    blocked_app_names: apps.map(app => app.name),
    blocked_website_names: websites.map(app => app.name),
  }
}

export const BlockingPreferenceApi = {
  getWorkflowBlockingPreferencesAsSearchOptions,
  saveWorkflowBlockingPreferences,
  getWorkflowBlockedApps,
  getDefaultSearchOptions,
  getWorkflowBlockedAppsAnalytics,
}


import type { SearchOption } from '@/components/AppSelector'
import { AppRepo, type App } from '@/db/monitor/appRepo'
import type { Tag } from '@/db/monitor/tagRepo'

interface BlockingAppConfig {
  external_id: string | null
  is_browser: boolean
}

export const prepareBlockingConfig = async (
  selectedApps: SearchOption[],
  isAllowList: boolean
): Promise<{ blockingApps: BlockingAppConfig[], isBlockList: boolean }> => {

  const directAppSelections: App[] = selectedApps
    .filter((option): option is Extract<SearchOption, { type: 'app' }> => option.type === 'app' && !!option.app)
    .map(option => option.app)

  const categorySelections: Tag[] = selectedApps
    .filter((option): option is Extract<SearchOption, { type: 'category' }> => option.type === 'category' && !!option.tag)
    .map(option => option.tag)

  const categoryTagIds = categorySelections.map(tag => tag.id).filter(id => id) as string[]

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
  const uniqueAppsToBlock = Array.from(uniqueAppsMap.values())

  const blockingApps: BlockingAppConfig[] = uniqueAppsToBlock.map((app: App) => ({
    external_id: app.app_external_id,
    is_browser: app.is_browser === 1
  }))

  const isBlockList = !isAllowList

  return { blockingApps, isBlockList }
} 

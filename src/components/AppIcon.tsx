import { AppsWithTime } from '../api/monitorApi/monitorApi'
import { apps } from '../lib/app-directory/apps-list'
import { categoryEmojis, AppCategory } from '../lib/app-directory/apps-types'

// Add this helper function at the top level
const getAppIcon = (app: AppsWithTime) => {
  if (app.is_browser) {
    return '🌐'
  }
  const appDef = apps.find(a =>
    (a.type === 'application' && a.name === app.app_name) ||
    (a.type === 'website' && a.websiteUrl === app.app_name)
  )
  return appDef ? categoryEmojis[app.category_tag?.tag_name as AppCategory] || '❓' : '❓'
}

export const AppIcon = ({ app }: { app: AppsWithTime }) => {
  if (app.is_browser) {
    const faviconUrl = `https://www.google.com/s2/favicons?domain=${encodeURIComponent(app.external_id)}&sz=32`
    return (
      <img
        src={faviconUrl}
        alt={app.app_name}
        className="h-5 w-5"
        onError={(e) => {
          const target = e.target as HTMLImageElement
          target.style.display = 'none'
          const parent = target.parentElement
          if (parent) {
            parent.textContent = '🌐' // Fallback to globe emoji if favicon fails
          }
        }}
      />
    )
  }
  return (
    app.icon ? (
      <img
        src={`/src/lib/app-directory/icons/${app.icon}`}
        alt={app.app_name}
        className="h-5 w-5"
        onError={(e) => {
          const target = e.target as HTMLImageElement
          target.style.display = 'none'
          const parent = target.parentElement
          if (parent) {
            parent.textContent = getAppIcon(app)
          }
        }}
      />
    ) : (
      <span className="text-muted-foreground">{getAppIcon(app)}</span>
    )
  )
}

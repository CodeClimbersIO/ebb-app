import { useEffect, useState } from 'react'
import { App } from '../db/monitor/appRepo'
import { categoryEmojis, AppCategory } from '../lib/app-directory/apps-types'
import { invoke } from '@tauri-apps/api/core'

// Add this helper function at the top level
const getAppIcon = (app: App) => {
  if (app.is_browser) {
    return '🌐'
  }

  return categoryEmojis[app.category_tag?.tag_name as AppCategory] || '❓'
}

const stripSubdomains = (url: string): string => {
  // Match the main domain and TLD, keeping the last two parts for known multi-part TLDs
  const parts = url.split('.')
  if (parts.length <= 2) return url
  return parts.slice(-2).join('.')
}

type IconSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl'

const sizeMap = {
  xs: 'h-3 w-3',
  sm: 'h-4 w-4',
  md: 'h-5 w-5',
  lg: 'h-6 w-6',
  xl: 'h-8 w-8'
}

const BrowserIcon = ({ app, size = 'md' }: { app: App; size?: IconSize }) => {
  const strippedDomain = stripSubdomains(app.app_external_id)
  const faviconUrl = `https://www.google.com/s2/favicons?domain=${encodeURIComponent(strippedDomain)}&sz=32`
  return (
    <img
      src={faviconUrl}
      alt={app.name}
      className={`${sizeMap[size]} object-contain`}
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

const DesktopIcon = ({ app, size = 'md' }: { app: App; size?: IconSize }) => {
  const [iconDataUrl, setIconDataUrl] = useState<string | null>(null)
  const [iconError, setIconError] = useState(false)

  useEffect(() => {
    const loadIcon = async () => {
      try {
        if (app.app_external_id) {
          const iconData = await invoke('get_app_icon', { bundleId: app.app_external_id })
          setIconDataUrl(iconData as string)
        }
      } catch (err) {
        console.error('Failed to load icon:', err)
        setIconError(true)
      }
    }

    loadIcon()
  }, [app.app_external_id])

  // Show fallback icon if we have an error or no app_external_id
  if (iconError || !app.app_external_id) {
    return (
      <span className="text-muted-foreground">{getAppIcon(app)}</span>
    )
  }

  // If we have successfully loaded an icon data URL, use it
  if (iconDataUrl) {
    return (
      <img
        src={iconDataUrl}
        alt={app.name}
        className={`${sizeMap[size]} object-contain`}
        onError={(e) => {
          const target = e.target as HTMLImageElement
          target.style.display = 'none'
          const parent = target.parentElement
          if (parent) {
            parent.textContent = getAppIcon(app)
          }
        }}
      />
    )
  }

  // If we have a static icon path from the app object, use it as before
  if (app.icon) {
    return (
      <img
        src={`/src/lib/app-directory/icons/${app.icon}`}
        alt={app.name}
        className={`${sizeMap[size]} object-contain`}
        onError={(e) => {
          const target = e.target as HTMLImageElement
          target.style.display = 'none'
          const parent = target.parentElement
          if (parent) {
            parent.textContent = getAppIcon(app)
          }
        }}
      />
    )
  }

  // Fallback to text icon
  return (
    <span className="text-muted-foreground">{getAppIcon(app)}</span>
  )
}


export const AppIcon = ({ app, size = 'md' }: { app: App; size?: IconSize }) => {
  if (app.is_browser) {
    return <BrowserIcon app={app} size={size} />
  }

  // For desktop apps, use one size larger if available
  const appSize = size === 'xl' ? 'xl' : 
                 (size === 'lg' ? 'xl' : 
                 (size === 'md' ? 'lg' : 
                 (size === 'sm' ? 'md' : 'sm')))
  return <DesktopIcon app={app} size={appSize} />
}

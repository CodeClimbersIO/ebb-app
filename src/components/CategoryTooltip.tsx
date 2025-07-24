import * as React from 'react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { AppCategory, categoryEmojis } from '@/lib/app-directory/apps-types'
import { Badge } from '@/components/ui/badge'
import { X, Plus } from 'lucide-react'
import { App } from '../db/monitor/appRepo'
import { AppIcon } from './AppIcon'
import { SearchOption } from './AppSelector'

interface CategoryTooltipProps {
  option: SearchOption
  onRemove?: (option: SearchOption) => void
  categoryCount?: number
  apps: App[]
  side?: 'right' | 'left' | 'top' | 'bottom'
  align?: 'start' | 'center' | 'end'
  delayDuration?: number
  children?: React.ReactNode
}

const getCategoryTooltipContent = (category: AppCategory, apps: App[]): React.ReactNode => {
  const categoryApps = apps.filter(app => app.category_tag?.tag_name === category)
  const nativeApps = categoryApps.filter(app => !app.is_browser)
  const websites = categoryApps.filter(app => app.is_browser)

  return (
    <div className="space-y-2 max-w-xs">
      <div>
        <strong className="text-xs font-medium">Websites:</strong>
        {websites.length > 0 ? (
          <ul className="grid grid-cols-2 gap-x-4 list-none pl-0 space-y-0.5 mt-1">
            {websites.map(app => (
              <li key={`web-${app.id}`} className="flex items-center gap-1.5 text-xs min-w-0">
                <AppIcon app={app} size="xs" />
                <span className="truncate">{app.app_external_id}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-xs text-muted-foreground/60 italic mt-1">None</p>
        )}
      </div>

      {websites.length > 0 && nativeApps.length > 0 && (
        <hr className="border-border/50" />
      )}

      <div>
        <strong className="text-xs font-medium">Apps:</strong>
        {nativeApps.length > 0 ? (
          <ul className="grid grid-cols-2 gap-x-4 list-none pl-0 space-y-0.5 mt-1">
            {nativeApps.map(app => (
              <li key={`app-${app.id}`} className="flex items-center gap-1.5 text-xs min-w-0">
                <AppIcon app={app} size="xs" />
                <span className="truncate">{app.name}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-xs text-muted-foreground/60 italic mt-1">None</p>
        )}
      </div>
    </div>
  )
}

export function CategoryTooltip({
  option,
  onRemove,
  categoryCount,
  apps,
  side = 'bottom',
  align = 'center',
  delayDuration = 0,
  children
}: CategoryTooltipProps) {
  const isCategory = 'category' in option && 'count' in option

  return (
    <TooltipProvider>
      <Tooltip delayDuration={delayDuration}>
        <TooltipTrigger asChild>
          {children || (
            <div className="flex items-center">
              <Badge variant="secondary" className="flex items-center gap-1 h-6">
                <span className="w-4 h-4 flex items-center justify-center shrink-0">
                  {option.type === 'app' ? (
                    <AppIcon app={option.app} />
                  ) : option.type === 'custom' ? (
                    <Plus className="h-3 w-3" />
                  ) : (
                    categoryEmojis[option.category as AppCategory]
                  )}
                </span>
                <span className="truncate">
                  {isCategory && categoryCount !== undefined
                    ? `${option.category} (${categoryCount})`
                    : option.type === 'app'
                      ? option.app.is_browser ? option.app.app_external_id : option.app.name
                      : option.type === 'custom'
                        ? option.url
                        : ''}
                </span>
                {onRemove && (
                  <X
                    className="h-3 w-3 cursor-pointer shrink-0"
                    onClick={(e) => {
                      e.stopPropagation()
                      onRemove(option)
                    }}
                  />
                )}
              </Badge>
            </div>
          )}
        </TooltipTrigger>
        {isCategory && (
          <TooltipContent side={side} align={align} className="max-w-[300px]">
            {getCategoryTooltipContent(option.category, apps)}
          </TooltipContent>
        )}
      </Tooltip>
    </TooltipProvider>
  )
} 

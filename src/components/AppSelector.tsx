'use client'

import * as React from 'react'
import { Check, X } from 'lucide-react'
import { Command, CommandEmpty, CommandGroup, CommandItem, CommandList } from '@/components/ui/command'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/tailwind.util'
import { AppDefinition, categoryEmojis } from '@/lib/app-directory/apps-types'
import { apps } from '@/lib/app-directory/apps-list'


interface AppSelectorProps {
  placeholder?: string
  emptyText?: string
  maxItems?: number
  selectedApps: AppDefinition[]
  currentCategory?: string
  onAppSelect: (app: AppDefinition) => void
  onAppRemove: (app: AppDefinition) => void
}

export function AppSelector({
  placeholder = 'Search apps...',
  emptyText = 'No apps found.',
  maxItems = 5,
  selectedApps,
  currentCategory,
  onAppSelect,
  onAppRemove
}: AppSelectorProps) {
  const [open, setOpen] = React.useState(false)
  const [search, setSearch] = React.useState('')
  const inputRef = React.useRef<HTMLDivElement>(null)
  const [selected, setSelected] = React.useState(0)
  const [highlightedApp, setHighlightedApp] = React.useState<AppDefinition | null>(null)

  // Add effect to reset search when dropdown closes
  React.useEffect(() => {
    if (!open) {
      setSearch('')
    }
  }, [open])

  // Update setOpen to also reset search when closing
  const handleClose = () => {
    setOpen(false)
    setSearch('')
  }

  // Filter apps based on search term and show all apps when search is empty
  const filteredApps = React.useMemo(() => {
    const searchLower = search.toLowerCase()
    return apps
      .filter(app => {
        // Filter by search if there is a search term
        if (search) {
          const searchableText = app.type === 'application' 
            ? app.name.toLowerCase()
            : app.websiteUrl.toLowerCase()
          return searchableText.includes(searchLower)
        }

        // Filter by category if specified
        if (currentCategory) {
          return app.category?.toLowerCase() === currentCategory.toLowerCase()
        }

        return true
      })
      .sort((a, b) => {
        if (!search) return 0

        const aStr = (a.type === 'application' ? a.name : a.websiteUrl).toLowerCase()
        const bStr = (b.type === 'application' ? b.name : b.websiteUrl).toLowerCase()
        
        const aStartsWith = aStr.startsWith(searchLower)
        const bStartsWith = bStr.startsWith(searchLower)
        
        if (aStartsWith && !bStartsWith) return -1
        if (!aStartsWith && bStartsWith) return 1
        return 0
      })
      .slice(0, maxItems)
  }, [search, maxItems, currentCategory])

  // Update click outside handler
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (inputRef.current && !inputRef.current.contains(event.target as Node)) {
        handleClose()
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Add keyboard event handler
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!open) return

    // Handle backspace/delete when search is empty to remove last selected app
    if ((e.key === 'Backspace' || e.key === 'Delete') && search === '' && selectedApps.length > 0) {
      e.preventDefault()
      onAppRemove(selectedApps[selectedApps.length - 1])
      return
    }

    if (filteredApps.length === 0) return

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelected((s) => (s + 1) % filteredApps.length)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelected((s) => (s - 1 + filteredApps.length) % filteredApps.length)
    } else if (e.key === 'Enter') {
      e.preventDefault()
      handleSelect(filteredApps[selected])
    }
  }

  // Reset selected index when filtered apps change
  React.useEffect(() => {
    setSelected(0)
  }, [filteredApps])

  const handleSelect = (app: AppDefinition) => {
    // Check if app is already selected
    const isSelected = selectedApps.some(selected => {
      if (app.type === 'application' && selected.type === 'application') {
        return app.name === selected.name
      }
      if (app.type === 'website' && selected.type === 'website') {
        return app.websiteUrl === selected.websiteUrl
      }
      return false
    })

    if (isSelected) {
      setHighlightedApp(app)
      // Remove highlight after animation
      setTimeout(() => setHighlightedApp(null), 1000)
    } else {
      onAppSelect(app)
    }
    
    setSearch('')
    setSelected(0)
  }

  return (
    <div className="relative w-full" ref={inputRef}>
      <div 
        className='relative min-h-[100px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring'
        onClick={() => setOpen(true)}
      >
        <div className='flex flex-wrap gap-2'>
          {selectedApps.map((app) => (
            <Badge 
              key={app.type === 'application' ? app.name : app.websiteUrl}
              variant='secondary'
              className={cn(
                'flex items-center gap-1 transition-all duration-300',
                highlightedApp && (
                  (app.type === 'application' && highlightedApp.type === 'application' && app.name === highlightedApp.name) ||
                  (app.type === 'website' && highlightedApp.type === 'website' && app.websiteUrl === highlightedApp.websiteUrl)
                ) && 'ring-2 ring-violet-500'
              )}
            >
              <span className="w-4 h-4 flex items-center justify-center">
                {app.icon ? (
                  <img 
                    src={`/src/lib/app-directory/icons/${app.icon}`} 
                    alt="" 
                    className="w-4 h-4"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement
                      target.parentElement!.textContent = app.category ? categoryEmojis[app.category] : '❓'
                    }}
                  />
                ) : (
                  app.category ? categoryEmojis[app.category] : '❓'
                )}
              </span>
              <span>{app.type === 'application' ? app.name : app.websiteUrl}</span>
              <X 
                className='h-3 w-3 cursor-pointer' 
                onClick={(e) => {
                  e.stopPropagation()
                  onAppRemove(app)
                }}
              />
            </Badge>
          ))}
          <div className="relative flex-1 min-w-[200px]">
            <input
              placeholder={placeholder}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onFocus={() => setOpen(true)}
              onKeyDown={handleKeyDown}
              className="w-full outline-none border-0 bg-transparent focus:border-0 focus:outline-none focus:ring-0 p-0"
            />
            {open && search.length > 0 && (
              <Command className="absolute left-0 top-full z-50 max-w-[250px] rounded-md border bg-popover shadow-md h-fit">
                <CommandList className="max-h-fit">
                  {filteredApps.length === 0 ? (
                    <CommandEmpty>{emptyText}</CommandEmpty>
                  ) : (
                    <CommandGroup>
                      {filteredApps.map((app, index) => (
                        <CommandItem
                          key={app.type === 'application' ? app.name : app.websiteUrl}
                          onSelect={() => handleSelect(app)}
                          className={cn(index === selected && 'bg-accent text-accent-foreground')}
                        >
                          <Check className={cn(
                            'mr-2 h-4 w-4',
                            index === selected ? 'opacity-100' : 'opacity-0'
                          )} />
                          <span className="w-4 h-4 flex items-center justify-center mr-2">
                            {app.icon ? (
                              <img 
                                src={`/src/lib/app-directory/icons/${app.icon}`} 
                                alt="" 
                                className="w-4 h-4"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement
                                  target.parentElement!.textContent = app.category ? categoryEmojis[app.category] : '❓'
                                }}
                              />
                            ) : (
                              app.category ? categoryEmojis[app.category] : '❓'
                            )}
                          </span>
                          {app.type === 'application' ? app.name : app.websiteUrl}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  )}
                </CommandList>
              </Command>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

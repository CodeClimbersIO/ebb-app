'use client'

import * as React from 'react'
import { Check, X, Plus } from 'lucide-react'
import { Command, CommandEmpty, CommandGroup, CommandItem, CommandList } from '@/components/ui/command'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils/tailwind.util'
import { AppCategory, categoryEmojis } from '@/lib/app-directory/apps-types'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { useEffect, useRef, useState } from 'react'
import { MonitorApi } from '../api/monitorApi/monitorApi'
import { App } from '../db/monitor/appRepo'
import { AppIcon } from './AppIcon'

interface CategoryOption {
  type: 'category'
  category: AppCategory
  count: number
}

interface AppOption {
  type: 'app'
  app: App
}

interface CustomWebsiteOption {
  type: 'custom'
  url: string
}

export type SearchOption = AppOption | CategoryOption | CustomWebsiteOption

interface AppSelectorProps {
  placeholder?: string
  emptyText?: string
  maxItems?: number
  selectedApps: SearchOption[]
  currentCategory?: string
  excludedCategories?: AppCategory[]
  onAppSelect: (option: SearchOption) => void
  onAppRemove: (option: SearchOption) => void
}

// Simplified helper function to get display text and key
const getOptionDetails = (option: SearchOption) => {
  if (option.type === 'app') {
    if (!option.app.is_browser) {
      return { text: option.app.name, key: `app-${option.app.app_external_id}` }
    }
    return { text: option.app.app_external_id, key: `app-${option.app.app_external_id}` }
  }
  if (option.type === 'custom') {
    return { text: option.url, key: `custom-${option.url}` }
  }
  if ('category' in option && 'count' in option) {
    return {
      text: `${option.category} (${option.count})`,
      key: `cat-${option.category}`
    }
  }
  return { text: '', key: '' }
}

// Add this helper function near other helper functions
const getCategoryTooltipContent = (category: AppCategory, apps: App[]): string => {
  const categoryApps = apps.filter(app => app.category_tag?.tag_name === category)
  const appNames = categoryApps.map(app => {
    if (app.is_browser) return app.app_external_id
    return app.name
  })
  return appNames.join(', ')
}

export function AppSelector({
  placeholder = 'Search apps...',
  emptyText = 'Keep typing for custom website',
  maxItems = 5,
  selectedApps,
  excludedCategories = [],
  onAppSelect,
  onAppRemove
}: AppSelectorProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const inputRef = useRef<HTMLDivElement>(null)
  const [selected, setSelected] = useState(0)
  const [apps, setApps] = useState<AppOption[]>([])
  // Combined close and reset functionality
  const handleClose = () => {
    setOpen(false)
    setSearch('')
  }


  useEffect(() => {
    const init = async () => {
      const apps = await MonitorApi.getApps()
      setApps(apps.map(app => ({ type: 'app', app: app })))
    }
    init()
  }, [])

  useEffect(() => {
    if (!open) {
      setSearch('')
    }
  }, [open])

  // Create memoized category options
  const categoryOptions = React.useMemo(() => {
    return Object.keys(categoryEmojis)
      .filter(category => !excludedCategories.includes(category as AppCategory))
      .map((category) => ({
        type: 'category' as const,
        category: category as AppCategory,
        count: apps.filter(app => app.type === 'app' && app.app.category_tag?.tag_name === category).length
      }))
  }, [apps, excludedCategories])

  // Update filtered apps to include categories
  const filteredOptions = React.useMemo(() => {
    const searchLower = search.toLowerCase()

    if (!search) {
      // When no search term, return all categories that aren't already selected
      return categoryOptions
        .filter(cat => !selectedApps.some(selected =>
          'category' in selected && selected.category === cat.category
        ))
        .sort((a, b) => a.category.localeCompare(b.category))
    }

    let results: SearchOption[] = categoryOptions
      .filter(cat =>
        cat.category.toLowerCase().includes(searchLower) &&
        !selectedApps.some(selected =>
          'category' in selected && selected.category === cat.category
        )
      )

    // Modified to only check for exact duplicates of the same app/website, not category
    results = results.concat(
      apps.filter(option => {
        const isDuplicate = selectedApps.some(selected => {
          if (option.type === 'app' && selected.type === 'app') {
            if (!option.app.is_browser && !selected.app.is_browser) {
              return option.app.name === selected.app.name
            }
            if (option.app.is_browser && selected.app.is_browser) {
              return option.app.app_external_id === selected.app.app_external_id
            }
          }
          return false
        })

        if (isDuplicate) return false

        if (option.type === 'app' && !option.app.is_browser) {
          return option.app.name.toLowerCase().includes(searchLower)
        }
        if (option.type === 'app' && option.app.is_browser) {
          return option.app.app_external_id.toLowerCase().includes(searchLower)
        }
      })
    )

    // Check if the search term looks like a URL and isn't already in the results
    const isValidUrl = (url: string) => {
      try {
        // Simple check for URL format (has domain-like structure)
        return /^(https?:\/\/)?[\w.-]+\.[a-z]{2,}(\/.*)?$/i.test(url)
      } catch {
        return false
      }
    }

    // Check if the search term might be a website
    const mightBeWebsite = search.includes('.') || search.includes('://')

    // Add custom website option if search looks like a URL and not already in results
    const customUrlAlreadyExists = results.some(option => 
      (option.type === 'app' && option.app.is_browser && option.app.app_external_id.toLowerCase() === searchLower) ||
      (option.type === 'custom' && option.url.toLowerCase() === searchLower)
    )

    // Check if the search term is already selected
    const alreadySelected = selectedApps.some(selected => 
      (selected.type === 'app' && selected.app.is_browser && selected.app.app_external_id.toLowerCase() === searchLower) ||
      (selected.type === 'custom' && selected.url.toLowerCase() === searchLower)
    )

    // Add custom website option if appropriate - use isValidUrl for better validation
    if (search && (isValidUrl(search) || mightBeWebsite) && !customUrlAlreadyExists && !alreadySelected) {
      results.push({
        type: 'custom',
        url: search
      })
    }

    return results
      .sort((a, b) => {
        const aStr = getOptionDetails(a).text.toLowerCase()
        const bStr = getOptionDetails(b).text.toLowerCase()

        // Custom website option should be at the bottom
        if (a.type === 'custom') return 1
        if (b.type === 'custom') return -1

        const aStartsWith = aStr.startsWith(searchLower)
        const bStartsWith = bStr.startsWith(searchLower)

        if (aStartsWith && !bStartsWith) return -1
        if (!aStartsWith && bStartsWith) return 1
        return 0
      })
      .slice(0, maxItems)
  }, [search, maxItems, categoryOptions, selectedApps, apps])

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

    if (filteredOptions.length === 0) return

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelected((s) => (s + 1) % filteredOptions.length)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelected((s) => (s - 1 + filteredOptions.length) % filteredOptions.length)
    } else if (e.key === 'Enter') {
      e.preventDefault()
      handleSelect(filteredOptions[selected])
    }
  }

  // Reset selected index when filtered apps change
  React.useEffect(() => {
    setSelected(0)
  }, [filteredOptions])

  const handleSelect = (option: SearchOption) => {
    const { key } = getOptionDetails(option)

    // For custom website option, create a new app-like object
    if (option.type === 'custom') {
      // Create a custom app option
      const customApp: AppOption = {
        type: 'app',
        app: {
          id: `custom-${Date.now()}`,
          name: option.url,
          app_external_id: option.url,
          is_browser: true,
          // Add any other required properties with default values
          category_tag: {
            id: 'custom',
            app_id: `custom-${Date.now()}`,
            tag_id: 'custom',
            weight: 3,
            tag_name: 'Website',
            tag_type: 'category'
          }
        }
      }
      
      onAppSelect(customApp)
      setSearch('')
      setSelected(0)
      return
    }

    // For non-category options, check if they belong to an already selected category
    if (option.type === 'app') {
      const category = option.app.category_tag?.tag_name
      const categoryAlreadySelected = selectedApps.some(selected =>
        'category' in selected && selected.category === category
      )

      if (categoryAlreadySelected) {
        // Add the item even if its category is already selected
        const exactDuplicate = selectedApps.find(selected =>
          'type' in selected && 'type' in option &&
          getOptionDetails(selected).key === key
        )

        if (!exactDuplicate) {
          onAppSelect(option)
        }
        setSearch('')
        setSelected(0)
        return
      }
    }

    // Rest of the existing selection logic
    if ('category' in option) {
      const categoryExists = selectedApps.some(selected =>
        'category' in selected && selected.category === option.category
      )

      if (!categoryExists) {
        onAppSelect(option)
      }
    } else {
      const exactDuplicate = selectedApps.find(selected =>
        'type' in selected && 'type' in option &&
        getOptionDetails(selected).key === key
      )

      if (!exactDuplicate) {
        onAppSelect(option)
      }
    }

    setSearch('')
    setSelected(0)
  }

  // Update isAlreadySelected function
  const isAlreadySelected = (searchTerm: string): { isSelected: boolean; message?: string } => {
    const searchLower = searchTerm.toLowerCase()

    // First check direct matches
    const directMatch = selectedApps.some(selected =>
      getOptionDetails(selected).text.toLowerCase().includes(searchLower)
    )
    if (directMatch) {
      return { isSelected: true, message: 'Already added' }
    }

    // Then check if the search matches any app/website that belongs to a selected category
    const searchMatchingApp = apps.find(app => {
      const appText = app.type === 'app' ? app.app.name : app.app.app_external_id
      return appText.toLowerCase().includes(searchLower)
    })

    if (searchMatchingApp) {
      const selectedCategory = selectedApps.find(selected =>
        'category' in selected && selected.category === searchMatchingApp.app.category_tag?.tag_name
      )

      if (selectedCategory && selectedCategory.type === 'app') {
        return {
          isSelected: true,
          message: `Already included in ${selectedCategory.app.category_tag?.tag_name} list`
        }
      }
    }

    return { isSelected: false }
  }

  // Add global keydown event listener
  React.useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // Only handle Delete or Backspace when not in an input field
      if ((e.key === 'Delete' || e.key === 'Backspace') && 
          selectedApps.length > 0 && 
          document.activeElement?.tagName !== 'INPUT' &&
          document.activeElement?.tagName !== 'TEXTAREA') {
        e.preventDefault()
        onAppRemove(selectedApps[selectedApps.length - 1])
      }
    }

    document.addEventListener('keydown', handleGlobalKeyDown)
    return () => document.removeEventListener('keydown', handleGlobalKeyDown)
  }, [selectedApps, onAppRemove])

  return (
    <div className="relative w-full" ref={inputRef}>
      <div className="relative min-h-[100px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        onClick={() => setOpen(true)}>
        <div className="flex flex-wrap gap-2 items-start">
          {selectedApps.map((option) => {
            const key = getOptionDetails(option).key
            const isCategory = 'category' in option && 'count' in option
            return (
              <TooltipProvider key={key}>
                <Tooltip>
                  <TooltipTrigger>
                    <div className="flex items-center">
                      <Badge
                        variant="secondary"
                        className="flex items-center gap-1 h-6"
                      >
                        <span className="w-4 h-4 flex items-center justify-center shrink-0">
                          {option.type === 'app' ? <AppIcon app={option.app} /> : option.type === 'custom' ? (
                            <Plus className="h-3 w-3" />
                          ) : (
                            categoryEmojis[option.category as AppCategory]
                          )}
                        </span>
                        <span className="truncate">{getOptionDetails(option).text}</span>
                        <X
                          className="h-3 w-3 cursor-pointer shrink-0"
                          onClick={(e) => {
                            e.stopPropagation()
                            onAppRemove(option)
                          }}
                        />
                      </Badge>
                    </div>
                  </TooltipTrigger>
                  {isCategory && (
                    <TooltipContent className="max-w-[300px]">
                      {getCategoryTooltipContent((option as CategoryOption).category, apps.map(app => app.app))}
                    </TooltipContent>
                  )}
                </Tooltip>
              </TooltipProvider>
            )
          })}

          <div className="relative flex-1 min-w-[200px]">
            <input
              placeholder={placeholder}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onFocus={() => setOpen(true)}
              onKeyDown={handleKeyDown}
              className="w-full outline-none border-0 bg-transparent focus:border-0 focus:outline-none focus:ring-0 p-0"
            />
            {open && (
              <Command className="absolute left-0 top-full z-50 max-w-[250px] rounded-md border bg-popover shadow-md h-fit mt-2">
                <CommandList className="max-h-[300px] overflow-y-auto">
                  {filteredOptions.length === 0 ? (
                    <CommandEmpty>
                      {search && isAlreadySelected(search).isSelected
                        ? isAlreadySelected(search).message
                        : emptyText}
                    </CommandEmpty>
                  ) : (
                    <CommandGroup>
                      {filteredOptions.map((option, index) => (
                        <TooltipProvider key={getOptionDetails(option).key}>
                          <Tooltip delayDuration={0}>
                            <TooltipTrigger asChild>
                              <div>
                                <CommandItem
                                  onSelect={() => handleSelect(option)}
                                  className={cn(index === selected && 'bg-accent text-accent-foreground')}
                                >
                                  <Check className={cn(
                                    'mr-1 h-4 w-4',
                                    index === selected ? 'opacity-100' : 'opacity-0'
                                  )} />
                                  <span className="w-6 h-6 flex items-center justify-center mr-1">
                                    {option.type === 'app' ? (
                                      <AppIcon app={option.app} />
                                    ) : option.type === 'custom' ? (
                                      <Plus className="h-4 w-4" />
                                    ) : (
                                      categoryEmojis[option.category as AppCategory]
                                    )}
                                  </span>
                                  {option.type === 'custom' ? (
                                    <span>Add custom website: <span className="font-semibold">{option.url}</span></span>
                                  ) : (
                                    getOptionDetails(option).text
                                  )}
                                </CommandItem>
                              </div>
                            </TooltipTrigger>
                            {'category' in option && 'count' in option && (
                              <TooltipContent side="right" align="start" className="max-w-[300px]">
                                {getCategoryTooltipContent((option as CategoryOption).category, apps.map(app => app.app))}
                              </TooltipContent>
                            )}
                          </Tooltip>
                        </TooltipProvider>
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

'use client'

import * as React from 'react'
import { Check, X } from 'lucide-react'
import { Command, CommandEmpty, CommandGroup, CommandItem, CommandList } from '@/components/ui/command'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/tailwind.util'
import { AppCategory, AppDefinition, categoryEmojis } from '@/lib/app-directory/apps-types'
import { apps } from '@/lib/app-directory/apps-list'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

interface CategoryOption {
  type: 'category'
  category: AppCategory
  count: number
}

type SearchOption = AppDefinition | CategoryOption

interface AppSelectorProps {
  placeholder?: string
  emptyText?: string
  maxItems?: number
  selectedApps: SearchOption[]
  currentCategory?: string
  onAppSelect: (option: SearchOption) => void
  onAppRemove: (option: SearchOption) => void
}

// Simplified helper function to get display text and key
const getOptionDetails = (option: SearchOption) => {
  if ('type' in option) {
    if (option.type === 'application') {
      return { text: option.name, key: `app-${option.name}` }
    }
    if (option.type === 'website') {
      return { text: option.websiteUrl, key: `web-${option.websiteUrl}` }
    }
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
const getCategoryTooltipContent = (category: AppCategory): string => {
  const categoryApps = apps.filter(app => app.category === category)
  const appNames = categoryApps.map(app => {
    if (app.type === 'application') return app.name
    return app.websiteUrl
  })
  return appNames.join(', ')
}

export function AppSelector({
  placeholder = 'Search apps...',
  emptyText = 'No apps found.',
  maxItems = 5,
  selectedApps,
  onAppSelect,
  onAppRemove
}: AppSelectorProps) {
  const [open, setOpen] = React.useState(false)
  const [search, setSearch] = React.useState('')
  const [duplicateKey, setDuplicateKey] = React.useState<string>('')
  const inputRef = React.useRef<HTMLDivElement>(null)
  const [selected, setSelected] = React.useState(0)

  // Combined close and reset functionality
  const handleClose = () => {
    setOpen(false)
    setSearch('')
  }

  React.useEffect(() => {
    if (!open) {
      setSearch('')
    }
  }, [open])

  // Create memoized category options
  const categoryOptions = React.useMemo(() => {
    return Object.keys(categoryEmojis).map((category) => ({
      type: 'category' as const,
      category: category as AppCategory,
      count: apps.filter(app => app.category === category).length
    }))
  }, [])

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

    // Modified this section to only filter out exact duplicates
    results = results.concat(
      apps.filter(app => {
        // Check only for exact duplicates of the same app/website
        const isDuplicate = selectedApps.some(selected => {
          if (!('type' in selected) || !('type' in app)) return false
          
          if (app.type === 'application' && selected.type === 'application') {
            return app.name === selected.name
          }
          if (app.type === 'website' && selected.type === 'website') {
            return app.websiteUrl === selected.websiteUrl
          }
          return false
        })

        if (isDuplicate) return false

        if (app.type === 'application') {
          return app.name.toLowerCase().includes(searchLower)
        }
        return app.websiteUrl.toLowerCase().includes(searchLower)
      })
    )

    return results
      .sort((a, b) => {
        const aStr = getOptionDetails(a).text.toLowerCase()
        const bStr = getOptionDetails(b).text.toLowerCase()
        
        const aStartsWith = aStr.startsWith(searchLower)
        const bStartsWith = bStr.startsWith(searchLower)
        
        if (aStartsWith && !bStartsWith) return -1
        if (!aStartsWith && bStartsWith) return 1
        return 0
      })
      .slice(0, maxItems)
  }, [search, maxItems, categoryOptions, selectedApps])

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
    
    if ('category' in option) {
      const categoryExists = selectedApps.some(selected => 
        'category' in selected && selected.category === option.category
      )

      if (categoryExists) {
        setDuplicateKey(option.category)
        setTimeout(() => setDuplicateKey(''), 2000)
        return
      }

      onAppSelect(option)
    } else {
      const exactDuplicate = selectedApps.find(selected => 
        'type' in selected && 'type' in option &&
        getOptionDetails(selected).key === key
      )

      if (exactDuplicate) {
        setDuplicateKey(key)
        setTimeout(() => setDuplicateKey(''), 2000)
      } else {
        onAppSelect(option)
      }
    }
    
    setSearch('')
    setSelected(0)
  }

  // Add function to check if search matches any selected item
  const isAlreadySelected = (searchTerm: string): boolean => {
    const searchLower = searchTerm.toLowerCase()
    return selectedApps.some(selected => 
      getOptionDetails(selected).text.toLowerCase().includes(searchLower)
    )
  }

  return (
    <div className="relative w-full" ref={inputRef}>
      <div className="relative min-h-[100px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        onClick={() => setOpen(true)}>
        <div className="flex flex-wrap gap-2">
          {selectedApps.map((option) => {
            const key = getOptionDetails(option).key
            const isCategory = 'type' in option && option.type === 'category'
            return (
              <TooltipProvider key={key}>
                <Tooltip>
                  <Badge 
                    variant="secondary"
                    className={cn(
                      'flex items-center gap-1 cursor-default select-none',
                      duplicateKey === key && 'outline outline-1 outline-violet-500'
                    )}
                  >
                    <TooltipTrigger asChild>
                      <div className="flex items-center gap-1">
                        <span className="w-4 h-4 flex items-center justify-center">
                          {('type' in option && 'icon' in option) ? (
                            <img 
                              src={`/src/lib/app-directory/icons/${option.icon}`} 
                              alt="" 
                              className="w-4 h-4"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement
                                const category = ('type' in option && (option.type === 'application' || option.type === 'website')) 
                                  ? option.category 
                                  : 'Utilities'
                                target.parentElement!.textContent = categoryEmojis[category as AppCategory]
                              }}
                            />
                          ) : (
                            'category' in option ? categoryEmojis[option.category] : '❓'
                          )}
                        </span>
                        <span>{getOptionDetails(option).text}</span>
                        <X 
                          className="h-3 w-3 cursor-pointer" 
                          onClick={(e) => {
                            e.stopPropagation()
                            onAppRemove(option)
                          }}
                        />
                      </div>
                    </TooltipTrigger>
                  </Badge>
                  {isCategory && (
                    <TooltipContent className="max-w-[300px]">
                      {getCategoryTooltipContent(option.category)}
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
              <Command className="absolute left-0 top-full z-50 max-w-[250px] rounded-md border bg-popover shadow-md h-fit">
                <CommandList className="max-h-fit">
                  {filteredOptions.length === 0 ? (
                    <CommandEmpty>
                      {search && isAlreadySelected(search) ? 'Already added' : emptyText}
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
                                    'mr-2 h-4 w-4',
                                    index === selected ? 'opacity-100' : 'opacity-0'
                                  )} />
                                  <span className="w-4 h-4 flex items-center justify-center mr-2">
                                    {('type' in option && 'icon' in option) ? (
                                      <img 
                                        src={`/src/lib/app-directory/icons/${option.icon}`} 
                                        alt="" 
                                        className="w-4 h-4"
                                        onError={(e) => {
                                          const target = e.target as HTMLImageElement
                                          const category = ('type' in option && (option.type === 'application' || option.type === 'website')) 
                                            ? option.category 
                                            : 'Utilities'
                                          target.parentElement!.textContent = categoryEmojis[category as AppCategory]
                                        }}
                                      />
                                    ) : (
                                      'category' in option ? categoryEmojis[option.category] : '❓'
                                    )}
                                  </span>
                                  {getOptionDetails(option).text}
                                </CommandItem>
                              </div>
                            </TooltipTrigger>
                            {'category' in option && (
                              <TooltipContent side="right" align="start" className="max-w-[300px]">
                                {getCategoryTooltipContent(option.category)}
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

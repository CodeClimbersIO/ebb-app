import * as React from 'react'
import { Layout } from '@/components/Layout'
import { ModeToggle } from '@/components/ModeToggle'
import { Switch } from '@/components/ui/switch'
import { useSettings } from '../hooks/useSettings'
import { Card } from '@/components/ui/card'
import { Code2, Palette, Wand2 } from 'lucide-react'
import { AppSelector } from '@/components/AppSelector'
import { apps } from '@/lib/app-directory/apps-list'
import { AppCategory, AppDefinition } from '@/lib/app-directory/apps-types'

type SearchOption = AppDefinition | { type: 'category', category: AppCategory, count: number }

// Get creative apps as presets, organized by role
const appsByRole = {
  developer: apps.filter(app => app.category === 'Coding'),
  designer: apps.filter(app => app.category === 'Designing'),
  creator: apps.filter(app => app.category === 'Creating')
}

export const SettingsPage = () => {
  const { showZeroState, toggleZeroState, userRole, setUserRole } = useSettings()
  
  const roleOptions = [
    { id: 'developer', title: 'Developer', icon: <Code2 className="h-6 w-6" />, statLabel: 'Time Spent Coding' },
    { id: 'designer', title: 'Designer', icon: <Palette className="h-6 w-6" />, statLabel: 'Time Spent Designing' },
    { id: 'creator', title: 'Creator', icon: <Wand2 className="h-6 w-6" />, statLabel: 'Time Spent Creating' }
  ]

  // Initialize selectedApps from localStorage or fall back to defaults
  const [selectedApps, setSelectedApps] = React.useState<SearchOption[]>(() => {
    const saved = localStorage.getItem(`selectedApps_${userRole}`)
    if (saved) {
      return JSON.parse(saved)
    }
    // Instead of returning individual apps, return the category
    return [{
      type: 'category',
      category: userRole === 'developer' ? 'Coding' : 
                userRole === 'designer' ? 'Designing' : 
                'Creating',
      count: appsByRole[userRole].length
    }]
  })

  // Load saved apps when role changes
  React.useEffect(() => {
    const saved = localStorage.getItem(`selectedApps_${userRole}`)
    if (saved) {
      setSelectedApps(JSON.parse(saved))
    } else {
      // Same default as above
      setSelectedApps([{
        type: 'category',
        category: userRole === 'developer' ? 'Coding' : 
                  userRole === 'designer' ? 'Designing' : 
                  'Creating',
        count: appsByRole[userRole].length
      }])
    }
  }, [userRole])

  // Save to localStorage whenever selectedApps changes
  React.useEffect(() => {
    localStorage.setItem(`selectedApps_${userRole}`, JSON.stringify(selectedApps))
  }, [selectedApps, userRole])

  const handleAppSelect = (option: SearchOption) => {
    setSelectedApps((prev: SearchOption[]) => {
      const newApps = [...prev, option]
      localStorage.setItem(`selectedApps_${userRole}`, JSON.stringify(newApps))
      return newApps
    })
  }

  const handleAppRemove = (option: SearchOption) => {
    setSelectedApps((prev: SearchOption[]) => {
      const newApps = prev.filter(app => {
        // For categories, only remove if it's the exact same category
        if ('category' in option && 'category' in app && option.type === 'category' && app.type === 'category') {
          return app.category !== option.category
        }
        // For apps/websites, only remove if it's the exact same app/website
        if ('type' in option && 'type' in app) {
          if (option.type === 'application' && app.type === 'application') {
            return app.name !== option.name
          }
          if (option.type === 'website' && app.type === 'website') {
            return app.websiteUrl !== option.websiteUrl
          }
        }
        return true
      })
      localStorage.setItem(`selectedApps_${userRole}`, JSON.stringify(newApps))
      return newApps
    })
  }

  return (
    <Layout>
      <div className="p-8">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-2xl font-semibold mb-8">Settings</h1>

          <div className="space-y-8">
            <div className="border rounded-lg p-6">
              <h2 className="text-lg font-semibold mb-4">Appearance</h2>
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">Theme</div>
                  <div className="text-sm text-muted-foreground">
                    Customize how Ebb looks on your device
                  </div>
                </div>
                <div className="relative">
                  <ModeToggle />
                </div>
              </div>
            </div>

            <div className="border rounded-lg p-6">
              <h2 className="text-lg font-semibold mb-4">Role</h2>
              <div className="space-y-4">
                <div>
                  <div className="grid grid-cols-3 gap-4">
                    {roleOptions.map((option) => (
                      <Card
                        key={option.id}
                        className={`p-4 cursor-pointer hover:border-primary transition-colors ${
                          userRole === option.id ? 'border-primary' : ''
                        }`}
                        onClick={() => setUserRole(option.id as 'developer' | 'designer' | 'creator')}
                      >
                        <div className="flex flex-col items-center text-center space-y-2">
                          {option.icon}
                          <div className="font-medium">{option.title}</div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>

                <div className='space-y-2'>
                  <label className='text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70'>
                    {userRole === 'developer' ? 'These apps/websites will count as coding' :
                     userRole === 'designer' ? 'These apps/websites will count as designing' :
                     'These apps/websites will count as creating'}
                  </label>
                  <AppSelector
                    placeholder='Search apps & websites...'
                    emptyText='No apps or websites found.'
                    selectedApps={selectedApps}
                    currentCategory={userRole === 'developer' ? 'Coding' : 
                                  userRole === 'designer' ? 'Designing' : 
                                  'Creating'}
                    onAppSelect={handleAppSelect}
                    onAppRemove={handleAppRemove}
                  />
                </div>
              </div>
            </div>

            <div className="border rounded-lg p-6">
              <h2 className="text-lg font-semibold mb-4">Developer Settings</h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">Show Zero State</div>
                    <div className="text-sm text-muted-foreground">
                      Toggle zero state UI for testing
                    </div>
                  </div>
                  <Switch
                    checked={showZeroState}
                    onCheckedChange={toggleZeroState}
                  />
                </div>
              </div>
            </div>
          </div>
          
          <div className="mt-12 flex justify-between text-sm text-muted-foreground/50">
            <div>Ebb Version 1.0.0</div>
            <div>Created with ♡ by Paul Hovley and Nathan Covey</div>
          </div>
        </div>
      </div>
    </Layout>
  )
} 

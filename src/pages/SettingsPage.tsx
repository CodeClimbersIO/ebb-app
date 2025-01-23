import { Layout } from '@/components/Layout'
import { ModeToggle } from '@/components/ModeToggle'
import { Switch } from '@/components/ui/switch'
import { useSettings } from '../hooks/useSettings'
import { Card } from '@/components/ui/card'
import { Code2, Palette, Wand2 } from 'lucide-react'

export const SettingsPage = () => {
  const { showZeroState, toggleZeroState, userRole, setUserRole } = useSettings()
  
  const roleOptions = [
    { id: 'developer', title: 'Developer', icon: <Code2 className="h-6 w-6" />, statLabel: 'Time Spent Coding' },
    { id: 'designer', title: 'Designer', icon: <Palette className="h-6 w-6" />, statLabel: 'Time Spent Designing' },
    { id: 'creator', title: 'Creator', icon: <Wand2 className="h-6 w-6" />, statLabel: 'Time Spent Creating' }
  ]

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
                <ModeToggle />
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

            <div className="border rounded-lg p-6">
              <h2 className="text-lg font-semibold mb-4">Goal</h2>
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
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
} 

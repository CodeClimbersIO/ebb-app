import { Layout } from '@/components/Layout'
import { ModeToggle } from '@/components/ModeToggle'
import { Switch } from '@/components/ui/switch'
import { useSettings } from '../hooks/useSettings'

export const SettingsPage = () => {
  const { showZeroState, toggleZeroState } = useSettings()
  
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
          </div>
        </div>
      </div>
    </Layout>
  )
} 

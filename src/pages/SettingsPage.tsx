import { Layout } from '@/components/Layout'
import { ModeToggle } from '@/components/ModeToggle'

export const SettingsPage = () => {
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
          </div>
        </div>
      </div>
    </Layout>
  )
} 

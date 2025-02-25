import { Button } from '@/components/ui/button'
import { useNavigate } from 'react-router-dom'
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card'
import { useState, useEffect } from 'react'
import { Github, Lock, Loader2, CheckCircle2 } from 'lucide-react'
import { invoke } from '@tauri-apps/api/core'

export const AccessibilityPage = () => {
  const navigate = useNavigate()
  const [showPrivacy, setShowPrivacy] = useState(false)
  const [permissionStatus, setPermissionStatus] = useState<'checking' | 'granted' | 'not_granted'>('checking')

  useEffect(() => {
    const checkPermissions = async () => {
      try {
        setPermissionStatus('checking')
        
        // Add a small delay to ensure loading state is visible
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        const hasPermissions = await invoke<boolean>('check_accessibility_permissions')
        
        setPermissionStatus(hasPermissions ? 'granted' : 'not_granted')
        
        return hasPermissions
      } catch (error) {
        console.error('❌ Error during permission check:', error)
        setPermissionStatus('not_granted')
        return false
      }
    }

    let interval: NodeJS.Timeout | null = null

    // Initial check
    checkPermissions().then(hasPermissions => {
      // Only set up the interval if permissions are not granted
      if (!hasPermissions) {
        interval = setInterval(async () => {
          const granted = await checkPermissions()
          if (granted && interval) {
            clearInterval(interval)
            interval = null
          }
        }, 3000)
      }
    })

    // Cleanup function
    return () => {
      if (interval) {
        clearInterval(interval)
      }
    }
  }, [])

  const handleRequestPermissions = async () => {
    try {
      await invoke('request_system_permissions')
      // The status will be updated by the interval checker
    } catch (error) {
      console.error('Failed to request permissions:', error)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
      <div className="max-w-md w-full text-center flex flex-col items-center">
        <h1 className="text-4xl font-bold mb-4">Enable Accessibility</h1>
        <p className="text-lg text-muted-foreground mb-3">
          Ebb needs accessibility permissions to support blocking, time tracking, and shortcuts.
        </p>
        
        <HoverCard open={showPrivacy} onOpenChange={setShowPrivacy}>
          <HoverCardTrigger asChild>
            <button 
              onClick={() => setShowPrivacy(!showPrivacy)}
              className="text-sm text-primary hover:underline inline-flex items-center gap-1"
            >
              Ebb is open source and local first
              <span className="text-xs">→</span>
            </button>
          </HoverCardTrigger>
          <HoverCardContent className="w-[340px] p-5" align="center">
            <div className="space-y-5 text-left">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <Github className="w-5 h-5 shrink-0" strokeWidth={1.5} />
                  <h4 className="font-semibold text-base">Open Source</h4>
                </div>
                <p className="text-sm text-muted-foreground pl-9">
                  Ebb is fully open source. You can see our code here and how the app collects data.
                </p>
              </div>
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <Lock className="w-5 h-5 shrink-0" strokeWidth={1.5} />
                  <h4 className="font-semibold text-base">Local First</h4>
                </div>
                <p className="text-sm text-muted-foreground pl-9">
                  All data stays on your device and is not shared with us, ensuring maximum privacy and security.
                </p>
              </div>
            </div>
          </HoverCardContent>
        </HoverCard>

        <Button 
          size="lg"
          onClick={permissionStatus === 'granted' ? 
            () => navigate('/onboarding/shortcut-tutorial') : 
            handleRequestPermissions}
          className="mt-8 mb-4"
        >
          {permissionStatus === 'granted' ? 'Continue' : 'Enable Permissions'}
        </Button>

        <div className="flex items-center gap-2 mt-4">
          {(permissionStatus === 'checking' || permissionStatus === 'not_granted') && (
            <>
              <Loader2 className="w-5 h-5 animate-spin text-primary" />
              <span className="text-sm">Detecting permissions status...</span>
            </>
          )}
          {permissionStatus === 'granted' && (
            <>
              <CheckCircle2 className="w-5 h-5 text-green-500" />
              <span className="text-sm text-green-500">Permissions granted</span>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

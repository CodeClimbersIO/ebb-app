import { Button } from '@/components/ui/button'
import { useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { Github, Lock, Loader2, CheckCircle2 } from 'lucide-react'
import { invoke } from '@tauri-apps/api/core'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { open } from '@tauri-apps/plugin-shell'
import { logAndToastError } from '@/lib/utils/ebbError.util'
import { OnboardingUtils } from '../lib/utils/onboarding.util'

export const AccessibilityPage = () => {
  const navigate = useNavigate()
  const [permissionStatus, setPermissionStatus] = useState<'checking' | 'granted' | 'not_granted'>('checking')

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null
    let mounted = true

    const checkPermissions = async (): Promise<boolean> => {
      try {
        if (!mounted) return false

        const hasPermissions = await invoke<boolean>('check_accessibility_permissions')
        setPermissionStatus(hasPermissions ? 'granted' : 'not_granted')

        if (hasPermissions) {
          await invoke('start_system_monitoring')
          if (interval) {
            clearInterval(interval)
            interval = null
          }
        }

        return hasPermissions
      } catch (error) {
        if (mounted) {
          logAndToastError(`❌ Error during permission check: ${error}`, error)
          setPermissionStatus('not_granted')
        }
        return false
      }
    }

    const initialCheck = async () => {
      setPermissionStatus('checking')
      const hasPermissions = await checkPermissions()
      
      if (!hasPermissions && mounted) {
        interval = setInterval(checkPermissions, 3000)
      }
    }

    initialCheck()

    return () => {
      mounted = false
      if (interval) {
        clearInterval(interval)
      }
    }
  }, [])

  const handleRequestPermissions = async () => {
    try {
      await invoke('request_system_permissions')
    } catch (error) {
      logAndToastError(`Failed to request permissions: ${error}`, error)
    }
  }

  const handleComplete = () => {
    OnboardingUtils.setOnboardingStep('shortcut-tutorial')
    navigate('/onboarding/shortcut-tutorial')
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
      <div className="max-w-md w-full text-center flex flex-col items-center">
        <h1 className="text-3xl font-bold mb-3">Enable Accessibility</h1>
        <p className="text-md text-muted-foreground mb-6 max-w-sm mx-auto">
          Ebb needs accessibility permissions to support blocking, time tracking, and shortcuts.
        </p>

        <div className="flex justify-center gap-10 mb-8">
          <Popover>
            <PopoverTrigger asChild>
              <button className="flex items-center gap-2 text-sm text-foreground hover:underline">
                <Github className="w-4 h-4 shrink-0" strokeWidth={1.5} />
                <span>Open Source</span>
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-[300px] p-4" align="center">
              <div className="space-y-2 text-left">
                <div className="flex items-center gap-2 mb-1">
                  <Github className="w-4 h-4 shrink-0" strokeWidth={1.5} />
                  <h4 className="font-semibold text-sm">Open Source</h4>
                </div>
                <p className="text-xs text-muted-foreground pl-6">
                  Ebb's code is fully transparent and open source. You can see the code{' '}
                  <a 
                    onClick={() => open('https://github.com/CodeClimbersIO/ebb-app')} 
                    className="text-blue-500 hover:underline dark:text-blue-400 cursor-pointer"
                  >
                    here
                  </a>{' '}
                  and self host if you wish.
                </p>
              </div>
            </PopoverContent>
          </Popover>

          <Popover>
            <PopoverTrigger asChild>
              <button className="flex items-center gap-2 text-sm text-foreground hover:underline">
                <Lock className="w-4 h-4 shrink-0" strokeWidth={1.5} />
                <span>Local First</span>
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-[300px] p-4" align="center">
              <div className="space-y-2 text-left">
                <div className="flex items-center gap-2 mb-1">
                  <Lock className="w-4 h-4 shrink-0" strokeWidth={1.5} />
                  <h4 className="font-semibold text-sm">Local First</h4>
                </div>
                <p className="text-xs text-muted-foreground pl-6">
                  All sensitive data stays on your device and is not shared with us, ensuring maximum privacy and security.{' '}
                  <a 
                    onClick={() => open('https://ebb.cool/privacy')} 
                    className="text-blue-500 hover:underline dark:text-blue-400 cursor-pointer"
                  >
                    Privacy Policy
                  </a>
                </p>
              </div>
            </PopoverContent>
          </Popover>
        </div>

        <div className="max-w-xs mx-auto w-full border-b mb-12" />

        <Button
          size="lg"
          onClick={permissionStatus === 'granted' ?
            handleComplete :
            handleRequestPermissions}
          className="mb-4"
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

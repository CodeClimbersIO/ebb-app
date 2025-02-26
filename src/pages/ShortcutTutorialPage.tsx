import { Button } from '@/components/ui/button'
import { useNavigate } from 'react-router-dom'
import { OnboardingUtils } from '@/lib/utils/onboarding'
import { useEffect, useState } from 'react'
import { register, unregister } from '@tauri-apps/plugin-global-shortcut'
import { getCurrentWindow } from '@tauri-apps/api/window'

export const ShortcutTutorialPage = () => {
  const navigate = useNavigate()
  const [cmdPressed, setCmdPressed] = useState(false)
  const [ePressed, setEPressed] = useState(false)

  const handleComplete = () => {
    OnboardingUtils.markOnboardingCompleted()
    navigate('/start-flow')
  }

  useEffect(() => {
    const registerShortcut = async () => {
      try {
        await register('CommandOrControl+E', async () => {
          setCmdPressed(true)
          setEPressed(true)
          // Get the current window and show/focus it
          const window = getCurrentWindow()
          await window.show()
          await window.setFocus()
          
          setTimeout(() => {
            handleComplete()
          }, 300)
        })
      } catch (error) {
        console.error('Failed to register shortcut:', error)
      }
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Meta' || e.key === 'Control') {
        setCmdPressed(true)
      } else if (e.key.toLowerCase() === 'e' && (e.metaKey || e.ctrlKey)) {
        setEPressed(true)
      }
    }

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'Meta' || e.key === 'Control') {
        setCmdPressed(false)
      } else if (e.key.toLowerCase() === 'e') {
        setEPressed(false)
      }
    }

    registerShortcut()
    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)

    return () => {
      unregister('CommandOrControl+E').catch(console.error)
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [])

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
      <h1 className="text-3xl font-bold mb-10">Your New Shortcut to Focus</h1>
      <div className="bg-muted/50 backdrop-blur-sm p-8 rounded-xl mb-10 shadow-lg min-w-[300px]">
        <div className="flex flex-col items-center gap-6">
          <div className="flex items-center gap-3">
            <kbd className={`px-5 py-3 text-xl font-bold bg-background border-2 border-border rounded-lg transition-all duration-200 ${cmdPressed ? 'bg-primary border-primary text-primary-foreground scale-110 shadow-lg' : ''}`}>⌘</kbd>
            <span className="text-2xl text-muted-foreground">+</span>
            <kbd className={`px-5 py-3 text-xl font-bold bg-background border-2 border-border rounded-lg transition-all duration-200 ${ePressed ? 'bg-primary border-primary text-primary-foreground scale-110 shadow-lg' : ''}`}>E</kbd>
          </div>
          <p className="text-muted-foreground text-center text-sm">to start a focus session anytime</p>
        </div>
      </div>
      <p className="text-lg text-muted-foreground mb-8 text-center max-w-md">
        Try it now! E for Ebb 😎
      </p>
      <Button 
        size="sm"
        variant="secondary"
        onClick={handleComplete}
        className="opacity-50 hover:opacity-100 transition-opacity"
      >
        Or click here instead
      </Button>
    </div>
  )
}

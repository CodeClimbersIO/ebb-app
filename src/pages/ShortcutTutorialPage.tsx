import { AnalyticsButton } from '@/components/ui/analytics-button'
import { useNavigate } from 'react-router-dom'
import { OnboardingUtils } from '@/lib/utils/onboarding.util'
import { ShortcutInput } from '@/components/ShortcutInput'
import { logAndToastError } from '@/lib/utils/ebbError.util'
import { useEffect } from 'react'
import { loadShortcut, updateGlobalShortcut, DEFAULT_SHORTCUT } from '@/api/ebbApi/shortcutApi'
import { useShortcutStore } from '@/lib/stores/shortcutStore'

export const ShortcutTutorialPage = () => {
  const navigate = useNavigate()
  const loadShortcutFromStore = useShortcutStore((state) => state.loadShortcutFromStorage)

  useEffect(() => {
    const initializeShortcut = async () => {
      try {
        const currentShortcut = await loadShortcut()
        if (!currentShortcut) {
          await updateGlobalShortcut(DEFAULT_SHORTCUT)
        }
        await loadShortcutFromStore()
      } catch (error) {
        logAndToastError(`Failed to initialize shortcut on tutorial page: ${error}`, error)
      }
    }
    void initializeShortcut()
  }, [loadShortcutFromStore])

  const handleComplete = async () => {
    try {
      await OnboardingUtils.markOnboardingCompleted()
      navigate('/start-flow')
    } catch (error) {
      logAndToastError(`Failed to complete shortcut tutorial step: ${error}`, error)
    }
  }

  return (
    <div className='min-h-screen flex flex-col items-center justify-center bg-background p-4'>
      <h1 className='text-3xl font-bold mb-4'>Your New Focus Shortcut</h1>
      <p className='text-muted-foreground text-center mb-10 max-w-sm'>
        Use this shortcut from anywhere on your computer to instantly start a focus session
      </p>
      
      <div className='max-w-xs mx-auto w-full border-b mb-10' />
      
      <div className='flex flex-col items-center gap-4 mb-10'>
        <ShortcutInput />

        <p className='text-muted-foreground text-center text-xs'>
          Click to change
        </p>
      </div>

      <AnalyticsButton
        size='lg'
        onClick={handleComplete}
        className='min-w-[200px]'
        analyticsEvent="shortcut_tutorial_completed"
        analyticsProperties={{
          destination: 'onboarding_continue',
          source: 'shortcut_tutorial_page'
        }}
      >
        Continue
      </AnalyticsButton>
    </div>
  )
}


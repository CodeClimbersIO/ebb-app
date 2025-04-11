import { Button } from '@/components/ui/button'
import { useNavigate } from 'react-router-dom'
import { OnboardingUtils } from '@/lib/utils/onboarding'
import { ShortcutInput } from '@/components/ShortcutInput'

export const ShortcutTutorialPage = () => {
  const navigate = useNavigate()

  const handleComplete = async () => {
    try {
      await OnboardingUtils.markOnboardingCompleted()
      navigate('/start-flow')
    } catch (error) {
      console.error(`Failed to complete shortcut tutorial step: ${error}`)
    }
  }

  return (
    <div className='min-h-screen flex flex-col items-center justify-center bg-background p-4'>
      <h1 className='text-3xl font-bold mb-10'>Your New Focus Shortcut</h1>
      
      <div className='flex flex-col items-center gap-6 mb-10'>
        <ShortcutInput />

        <p className='text-muted-foreground text-center text-sm'>
          Keep the default or click to change
        </p>
      </div>

      <Button
        size='lg'
        onClick={handleComplete}
        className='min-w-[200px]'
      >
        Continue
      </Button>
    </div>
  )
}


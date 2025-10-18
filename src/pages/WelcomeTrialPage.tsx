import { AnalyticsButton } from '@/components/ui/analytics-button'
import { useNavigate } from 'react-router-dom'
import { OnboardingUtils } from '@/lib/utils/onboarding.util'
import { Layers, Shield, Calendar, MessageSquare, Eye, BarChart3 } from 'lucide-react'
import { useStartTrial } from '@/api/hooks/useLicense'
import { useEffect } from 'react'
import { logAndToastError } from '@/lib/utils/ebbError.util'
import { useAuth } from '@/hooks/useAuth'
import { toast } from 'sonner'
import { ApiError } from '@/api/platformRequest'

export const WelcomeTrialPage = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const startTrialMutation = useStartTrial()

  useEffect(() => {
    // Automatically start the trial when the page loads
    startTrialMutation.mutate(undefined, {
      onError: (error) => {
        // Check if user already has a license (422 error)
        if (error instanceof ApiError && error.statusCode === 422) {
          // User already has a trial/license, show notification
          const email = user?.email || 'This account'
          toast.info(`${email} already has a free trial`)
        } else {
          // Other error - log it but don't block the user from continuing
          logAndToastError('Failed to start trial, but you can continue', error)
        }
      }
    })
  }, [user?.email]) // Empty dependency array means this runs once on mount

  const handleContinue = () => {
    OnboardingUtils.setOnboardingStep('accessibility')
    navigate('/onboarding/accessibility')
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
      <div className="max-w-lg w-full text-center flex flex-col items-center">
        {/* Trial Badge */}
        <div className="mb-6">
          <div className="inline-block px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium">
            2 WEEK FREE TRIAL
          </div>
        </div>

        {/* Headline */}
        <h1 className="text-3xl font-bold mb-3">
          You've unlocked Ebb Pro
        </h1>

        {/* Subtext */}
        <p className="text-md text-muted-foreground mb-6">
          Your 2-week free trial has started! 
          <br />
          No credit card required
        </p>

        <div className="max-w-xs mx-auto w-full border-b mb-8" />

        {/* Feature List - Two Column Grid */}
        <div className="grid grid-cols-2 gap-x-8 gap-y-3 mb-12 w-full max-w-lg">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-6 h-5 text-primary shrink-0" />
            <div className="font-medium text-sm">Hands-Free Time Tracking</div>
          </div>


          <div className="flex items-center gap-2">
            <Shield className="w-6 h-5 text-primary shrink-0" />
            <div className="font-medium text-sm">Site and App Blocking</div>
          </div>



          <div className="flex items-center gap-2">
            <MessageSquare className="w-6 h-5 text-primary shrink-0" />
            <div className="font-medium text-sm">Slack & Spotify Integrations</div>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="w-6 h-5 text-primary shrink-0" />
            <div className="font-medium text-sm">Schedule Focus Sessions</div>
          </div>

          <div className="flex items-center gap-2">
            <Eye className="w-6 h-5 text-primary shrink-0" />
            <div className="font-medium text-sm">Doomscroll Detection</div>
          </div>
          <div className="flex items-center gap-2">
            <Layers className="w-6 h-5 text-primary shrink-0" />
            <div className="font-medium text-sm">Multiple Focus Profiles</div>
          </div>


        </div>

        {/* Continue Button */}
        <AnalyticsButton
          size="lg"
          onClick={handleContinue}
          className="w-full max-w-xs"
          analyticsEvent="onboarding_continue_clicked"
          analyticsProperties={{ button_location: 'welcome_trial_page' }}
        >
          Continue
        </AnalyticsButton>
      </div>
    </div>
  )
}

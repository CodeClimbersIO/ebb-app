import { AnalyticsButton } from '@/components/ui/analytics-button'
import { useNavigate } from 'react-router-dom'
import { SlackIcon } from '@/components/icons/SlackIcon'
import { OnboardingUtils } from '@/lib/utils/onboarding.util'
import { initiateSlackOAuth } from '@/lib/utils/slackAuth.util'
import { useAuth } from '@/hooks/useAuth'

export const SlackOnboardingPage = () => {
  const navigate = useNavigate()
  const { user } = useAuth()

  const handleConnect = async () => {
    if (user) {
      await initiateSlackOAuth()
    }
  }

  const handleSkip = () => {
    OnboardingUtils.setOnboardingStep('shortcut-tutorial')
    navigate('/onboarding/shortcut-tutorial')
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
      <div className="max-w-md w-full text-center flex flex-col items-center">
        <div className="mb-6">
          <SlackIcon className="w-16 h-16 mx-auto" />
        </div>
        
        <h1 className="text-3xl font-bold mb-3">Connect Slack</h1>
        <p className="text-md text-muted-foreground mb-6 max-w-sm mx-auto">
          Remove distractions from your focus time by connecting Slack. We'll set you to "Do Not Disturb" and update your status during focus sessions.
        </p>

        <div className="max-w-xs mx-auto w-full border-b mb-12" />

        <div className="flex flex-col gap-3 w-full max-w-xs">
          <AnalyticsButton
            size="lg"
            onClick={handleConnect}
            disabled={!user}
            className="mb-2"
            analyticsEvent="slack_connect_clicked"
            analyticsProperties={{
              context: 'slack_connect',
              button_location: 'slack_onboarding_page'
            }}
          >
            {!user ? 'Login Required' : 'Connect Slack'}
          </AnalyticsButton>
          
          <AnalyticsButton
            variant="outline"
            size="lg"
            onClick={handleSkip}
            analyticsEvent="slack_connect_skipped"
            analyticsProperties={{
              destination: 'skip_slack',
              source: 'slack_onboarding_page'
            }}
          >
            Skip for Now
          </AnalyticsButton>
        </div>

        {!user && (
          <p className="text-sm text-muted-foreground mt-4">
            Please complete login to connect Slack
          </p>
        )}
      </div>
    </div>
  )
}

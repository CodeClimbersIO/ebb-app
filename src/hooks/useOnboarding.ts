import { useLocation, useNavigate } from 'react-router-dom'
import { OnboardingUtils } from '../lib/utils/onboarding.util'

export const useOnboarding = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const onboardingCompleted = OnboardingUtils.isOnboardingCompleted()
  if(onboardingCompleted){
    return
  }
  const onboardingStep = OnboardingUtils.getOnboardingStep()
  if(location.pathname === onboardingStep){
    return
  }
  navigate(`/onboarding/${onboardingStep}`)

}

const ONBOARDING_COMPLETED_KEY = 'onboarding_completed'

export const OnboardingUtils = {
  isOnboardingCompleted: (): boolean => {
    return localStorage.getItem(ONBOARDING_COMPLETED_KEY) === 'true'
  },

  markOnboardingCompleted: (): void => {
    localStorage.setItem(ONBOARDING_COMPLETED_KEY, 'true')
  },

  resetOnboarding: (): void => {
    localStorage.removeItem(ONBOARDING_COMPLETED_KEY)
  }

}

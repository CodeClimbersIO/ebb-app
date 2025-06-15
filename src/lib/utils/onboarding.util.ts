const ONBOARDING_COMPLETED_KEY = 'onboarding_completed'
const ONBOARDING_STEP_KEY = 'onboarding_step'

type OnboardingStep = 'accessibility' | 'shortcut-tutorial' | 'login'
export const OnboardingUtils = {
  getOnboardingStep: (): OnboardingStep => {
    const step = localStorage.getItem(ONBOARDING_STEP_KEY)
    return step as OnboardingStep | 'login'
  },

  setOnboardingStep: (step: OnboardingStep): void => {
    localStorage.setItem(ONBOARDING_STEP_KEY, step)
  },

  isOnboardingCompleted: (): boolean => {
    return localStorage.getItem(ONBOARDING_COMPLETED_KEY) === 'true'
  },

  markOnboardingCompleted: (): void => {
    localStorage.setItem(ONBOARDING_COMPLETED_KEY, 'true')
  },

  resetOnboarding: (): void => {
    localStorage.removeItem(ONBOARDING_COMPLETED_KEY)
    localStorage.removeItem(ONBOARDING_STEP_KEY)
  }
}

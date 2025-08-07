import { HashRouter, Route, Routes, Navigate, useNavigate} from 'react-router-dom'
import { HomePage } from '@/pages/HomePage'
import { LoginPage } from '@/pages/LoginPage'
import { CommunityPage } from '@/pages/CommunityPage'
import { SettingsPage } from '@/pages/SettingsPage/SettingsPage'
import { useAuth } from '@/hooks/useAuth'
import { FlowPage } from '@/pages/FlowPage/FlowPage'
import { AccessibilityPage } from '@/pages/AccessibilityPage'
import { SlackOnboardingPage } from '@/pages/SlackOnboardingPage'
import { ShortcutTutorialPage } from '@/pages/ShortcutTutorialPage'
// import { DeviceLimitPage } from './pages/DeviceLimitPage'
import { useDeepLink } from '@/hooks/useDeepLink'
import { getCurrentWindow } from '@tauri-apps/api/window'
import { useEffect } from 'react'
import { useGlobalShortcut } from '@/hooks/useGlobalShortcut'
import { logAndToastError } from '@/lib/utils/ebbError.util'
import FeedbackPage from '@/pages/FeedbackPage'
import { toastStore } from '@/lib/stores/toastStore'
import { useStore } from 'zustand'
import CategoryDashboardPage from './pages/CategoryDashboardPage'
import { StartFlowPage } from '@/pages/StartFlowPage/StartFlowPage'
import { FriendsAnalyticsPage } from '@/pages/FriendsAnalyticsPage/FriendsAnalyticsPage'
import FocusSchedulePage from '@/pages/FocusSchedulePage'
import { useLicenseWithDevices } from '@/api/hooks/useLicense'
import { useOnboarding } from '@/hooks/useOnboarding'
import { useCheckout } from '@/hooks/useCheckout'
import { useFlowListener } from '@/hooks/useFlowListener'
import { useNotificationListener } from '@/hooks/useNotificationListener'


const Router = () => {
  useDeepLink()
  useCheckout()
  useGlobalShortcut()
  const navigate = useNavigate()
  const { user } = useAuth()
  useLicenseWithDevices(user?.id || null)
  useOnboarding()
  useFlowListener()
  useNotificationListener()
  const { error } = useStore(toastStore)

  useEffect(() => {
    if (error) {
      navigate('/feedback')
    }
  }, [error])

  useEffect(() => {
    let unlistenNavigate: (() => void) | undefined

    const setup = async () => {
      try {
        const window = getCurrentWindow()
        unlistenNavigate = await window.listen('navigate', (event) => {
          const path = event.payload as string
          navigate(path)
        })
      } catch (error) {
        logAndToastError(`(Router) Failed to set up tray navigation: ${error}`, error)
      }
    }

    setup()

    return () => {
      if (unlistenNavigate) {
        unlistenNavigate()
      }
    }
  }, [navigate])

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/onboarding/login" element={<LoginPage />} />

      {/* Protected routes group */}
      <Route path="/" element={<HomePage />} />
      <Route path="/community" element={<CommunityPage />} />
      <Route path="/settings" element={<SettingsPage />} />
      <Route path="/friends-analytics" element={<FriendsAnalyticsPage />} />
      <Route path="/category-dashboard" element={<CategoryDashboardPage />} />
      <Route path="/focus-schedule" element={<FocusSchedulePage />} />
      <Route path="/start-flow" element={<StartFlowPage />} />
      <Route path="/flow" element={<FlowPage />} />
      <Route path="/feedback" element={<FeedbackPage />} />
      <Route path="/onboarding/accessibility" element={<AccessibilityPage />} />
      <Route path="/onboarding/slack-onboarding" element={<SlackOnboardingPage />} />
      <Route path="/onboarding/shortcut-tutorial" element={<ShortcutTutorialPage />} />

      {/* 404 catch-all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export const AppRouter = () => {
  return (
    <HashRouter>
      <Router />
    </HashRouter>
  )
}

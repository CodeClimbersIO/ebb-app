import { HashRouter, Route, Routes, Navigate, useNavigate, Outlet, useLocation } from 'react-router-dom'
import { HomePage } from '@/pages/HomePage'
import { LoginPage } from '@/pages/LoginPage'
import { FriendsPage } from '@/pages/FriendsPage'
import { SettingsPage } from '@/pages/SettingsPage'
import { StartFlowPage } from './pages/StartFlowPage'
import { useAuth } from './hooks/useAuth'
import { FlowPage } from './pages/FlowPage'
import { BreathingExercisePage } from './pages/BreathingExercisePage'
import { FlowRecapPage } from '@/pages/FlowRecapPage'
import { LoadingScreen } from '@/components/LoadingScreen'
import { AccessibilityPage } from './pages/AccessibilityPage'
import { ShortcutTutorialPage } from '@/pages/ShortcutTutorialPage'
import { DeviceLimitPage } from './pages/DeviceLimitPage'
import { OnboardingUtils } from '@/lib/utils/onboarding'
import { useDeepLinkAuth } from './hooks/useDeepLinkAuth'
import { getCurrentWindow } from '@tauri-apps/api/window'
import { useEffect } from 'react'
import { useGlobalShortcut } from './hooks/useGlobalShortcut'
import { logAndToastError } from '@/lib/utils/logAndToastError'
import { useLicenseStore } from './stores/licenseStore'
import FeedbackPage from './pages/FeedbackPage'
import { toastStore } from './lib/stores/toastStore'
import { useStore } from 'zustand'


const ProtectedRoute = () => {
  const { user, loading: authLoading } = useAuth()
  const { deviceInfo } = useLicenseStore()
  const location = useLocation()
  const { fetchLicense, initSubscription, clearSubscription } = useLicenseStore()
  
  useEffect(() => {
    if (user) {
      fetchLicense(user.id)
      initSubscription(user.id)
    } else {
      fetchLicense(null)
      clearSubscription()
    }

    return () => {
      clearSubscription()
    }
  }, [user, fetchLicense, initSubscription, clearSubscription])

  if (authLoading) {
    return <LoadingScreen />
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (deviceInfo.isDeviceLimitReached) {
    return <DeviceLimitPage />
  }

  if (location.pathname === '/onboarding/accessibility' ||
    location.pathname === '/onboarding/shortcut-tutorial') {
    return <Outlet />
  }

  if (!OnboardingUtils.isOnboardingCompleted()) {
    return <Navigate to="/onboarding/accessibility" replace />
  }

  return <Outlet />
}

const Router = () => {
  useDeepLinkAuth()
  const navigate = useNavigate()
  useGlobalShortcut()
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

    void setup()

    return () => {
      if (unlistenNavigate) {
        unlistenNavigate()
      }
    }
  }, [navigate])

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      {/* Protected routes group */}
      <Route element={<ProtectedRoute />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/friends" element={<FriendsPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/start-flow" element={<StartFlowPage />} />
        <Route path="/breathing-exercise" element={<BreathingExercisePage />} />
        <Route path="/flow" element={<FlowPage />} />
        <Route path="/flow-recap" element={<FlowRecapPage />} />
        <Route path="/feedback" element={<FeedbackPage />} />
        <Route path="/onboarding/accessibility" element={<AccessibilityPage />} />
        <Route path="/onboarding/shortcut-tutorial" element={<ShortcutTutorialPage />} />
      </Route>

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

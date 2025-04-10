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
import { OnboardingUtils } from '@/lib/utils/onboarding'
import { useDeepLinkAuth } from './hooks/useDeepLinkAuth'
import { getCurrentWindow } from '@tauri-apps/api/window'
import { useEffect } from 'react'
import { error as logError } from '@tauri-apps/plugin-log'
import { useGlobalShortcut } from './hooks/useGlobalShortcut'

// Protected Route wrapper component
const ProtectedRoute = () => {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return <LoadingScreen />
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  // Skip onboarding check for onboarding routes themselves
  if (location.pathname === '/onboarding/accessibility' ||
    location.pathname === '/onboarding/shortcut-tutorial') {
    return <Outlet />
  }

  // Redirect to onboarding if not completed
  if (!OnboardingUtils.isOnboardingCompleted()) {
    return <Navigate to="/onboarding/accessibility" replace />
  }

  return <Outlet />
}

const Router = () => {
  useDeepLinkAuth()
  const navigate = useNavigate()
  useGlobalShortcut()

  useEffect(() => {
    let unlistenNavigate: (() => void) | undefined

    const setup = async () => {
      try {
        // Listen for navigation events from the tray menu
        const window = getCurrentWindow()
        unlistenNavigate = await window.listen('navigate', (event) => {
          const path = event.payload as string
          navigate(path)
        })
      } catch (error) {
        logError(`(Router) Failed to set up tray navigation: ${error}`)
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

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
import { ShortcutTutorialPage } from './pages/ShortcutTutorialPage'
import { DeviceLimitPage } from './pages/DeviceLimitPage'
import { OnboardingUtils } from '@/lib/utils/onboarding'
import { useDeepLinkAuth } from './hooks/useDeepLinkAuth'
import { register, unregister } from '@tauri-apps/plugin-global-shortcut'
import { getCurrentWindow } from '@tauri-apps/api/window'
import { useEffect } from 'react'
import { FlowSessionApi } from './api/ebbApi/flowSessionApi'
import { error as logError } from '@tauri-apps/plugin-log'
import { useDeviceRegistration } from './hooks/useDeviceRegistration'

// Protected Route wrapper component
const ProtectedRoute = () => {
  const { user, loading: authLoading } = useAuth()
  const { isBlockedByDeviceLimit, retryDeviceRegistrationCheck } = useDeviceRegistration()
  const location = useLocation()

  // Add check on route change
  useEffect(() => {
    if (user && !authLoading) {
      retryDeviceRegistrationCheck()
    }
  }, [location.pathname])

  if (authLoading) {
    return <LoadingScreen />
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (isBlockedByDeviceLimit) {
    return <DeviceLimitPage onDeviceRemoved={retryDeviceRegistrationCheck} />
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

const GlobalShortcuts = ({ children }: { children: React.ReactNode }) => {
  const navigate = useNavigate()

  useEffect(() => {
    let unlistenNavigate: (() => void) | undefined

    const registerShortcuts = async () => {
      try {
        await register('CommandOrControl+E', async (event) => {
          if (event.state === 'Pressed') {
            // Get the current window and show/focus it
            const window = getCurrentWindow()
            await window.show()
            await window.setFocus()

            // Check if there's an active flow session
            const activeSession = await FlowSessionApi.getInProgressFlowSession()
            if (activeSession) {
              navigate('/flow')
            } else {
              navigate('/start-flow')
            }
          }
        })

        // Listen for navigation events from the tray menu
        const window = getCurrentWindow()
        unlistenNavigate = await window.listen('navigate', (event) => {
          const path = event.payload as string
          navigate(path)
        })
      } catch (error) {
        logError(`Failed to register global shortcut: ${error}`)
      }
    }

    registerShortcuts()

    // Cleanup on unmount
    return () => {
      const cleanup = async () => {
        try {
          await unregister('CommandOrControl+E')
          if (unlistenNavigate) {
            unlistenNavigate()
          }
        } catch (error) {
          logError(`Failed to unregister global shortcut: ${error}`)
        }
      }
      cleanup()
    }
  }, [navigate])

  return <>{children}</>
}

const Router = () => {
  useDeepLinkAuth()

  return (
    <GlobalShortcuts>
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
    </GlobalShortcuts>
  )
}

export const AppRouter = () => {
  return (
    <HashRouter>
      <Router />
    </HashRouter>
  )
}

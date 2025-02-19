import { HashRouter, Route, Routes, Navigate, Outlet, useNavigate } from 'react-router-dom'
import { HomePage } from '@/pages/HomePage'
import { LoginPage } from '@/pages/LoginPage'
import { SignupPage } from '@/pages/SignupPage'
import { FriendsPage } from '@/pages/FriendsPage'
import { SettingsPage } from '@/pages/SettingsPage'
import { StartFlowPage } from './pages/StartFlowPage'
import { useAuth } from './hooks/useAuth'
import { FlowPage } from './pages/FlowPage'
import { BreathingExercisePage } from './pages/BreathingExercisePage'
import { FlowRecapPage } from '@/pages/FlowRecapPage'
import { LoadingScreen } from '@/components/LoadingScreen'
import { OnboardingPage } from '@/pages/OnboardingPage'
import { useDeepLinkAuth } from '@/hooks/useDeepLinkAuth'
import { register, unregister } from '@tauri-apps/plugin-global-shortcut'
import { getCurrentWindow } from '@tauri-apps/api/window'
import { useEffect } from 'react'

// Protected Route wrapper component
const ProtectedRoute = () => {
  const { user, loading } = useAuth()

  if (loading) {
    return <LoadingScreen />
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  return <Outlet />
}

const GlobalShortcuts = ({ children }: { children: React.ReactNode }) => {
  const navigate = useNavigate()

  useEffect(() => {
    const registerShortcuts = async () => {
      try {
        await register('CommandOrControl+E', async (event) => {
          if (event.state === 'Pressed') {
            // Get the current window and focus it
            const window = getCurrentWindow()
            await window.unminimize()
            await window.setFocus()
            
            // Navigate to start-flow page
            navigate('/start-flow')
          }
        })
      } catch (error) {
        console.error('Failed to register global shortcut:', error)
      }
    }

    registerShortcuts()

    // Cleanup on unmount
    return () => {
      const cleanup = async () => {
        try {
          await unregister('CommandOrControl+E')
        } catch (error) {
          console.error('Failed to unregister global shortcut:', error)
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
        <Route path="/signup" element={<SignupPage />} />

        {/* Protected routes group */}
        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/friends" element={<FriendsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/start-flow" element={<StartFlowPage />} />
          <Route path="/breathing-exercise" element={<BreathingExercisePage />} />
          <Route path="/flow" element={<FlowPage />} />
          <Route path="/flow-recap" element={<FlowRecapPage />} />
          <Route path="/onboarding" element={<OnboardingPage />} />
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


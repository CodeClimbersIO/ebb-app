import { HashRouter, Route, Routes, Navigate, useNavigate} from 'react-router-dom'
import { HomePage } from '@/pages/HomePage'
import { LoginPage } from '@/pages/LoginPage'
import { CommunityPage } from '@/pages/CommunityPage'
import { SettingsPage } from '@/pages/SettingsPage'
import { useAuth } from '@/hooks/useAuth'
import { FlowPage } from '@/pages/FlowPage'
import { BreathingExercisePage } from '@/pages/BreathingExercisePage'
import { FlowRecapPage } from '@/pages/FlowRecapPage'
import { AccessibilityPage } from '@/pages/AccessibilityPage'
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
import { StartFlowPage } from '@/pages/StartFlowPage'
import { FriendsAnalyticsPage } from '@/pages/FriendsAnalyticsPage/FriendsAnalyticsPage'
import { useLicenseWithDevices } from '@/api/hooks/useLicense'
import { useOnboarding } from '@/hooks/useOnboarding'
import { useCheckout } from '@/hooks/useCheckout'
import { FlowSessionApi } from './api/ebbApi/flowSessionApi'
import { WorkflowApi } from './api/ebbApi/workflowApi'


const Router = () => {
  useDeepLink()
  useCheckout()
  useGlobalShortcut()
  const navigate = useNavigate()
  const { user } = useAuth()
  useLicenseWithDevices(user?.id || null)
  useOnboarding()
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
    const init = async () => {
      const flowSession = await FlowSessionApi.getInProgressFlowSession()
      if (flowSession) {
        navigate('/flow')
      }
      window.addEventListener('flow-session-started', async ()=>{
        const flowSession = await FlowSessionApi.getInProgressFlowSession()
        if (!flowSession || !flowSession.workflow_id) return
        const workflow = await WorkflowApi.getWorkflowById(flowSession.workflow_id)
        if (workflow?.settings.hasBreathing) {
          navigate('/breathing-exercise')
        } else {
          navigate('/flow')
        }
      })
    }
    init()
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
      <Route path="/start-flow" element={<StartFlowPage />} />
      <Route path="/breathing-exercise" element={<BreathingExercisePage />} />
      <Route path="/flow" element={<FlowPage />} />
      <Route path="/flow-recap" element={<FlowRecapPage />} />
      <Route path="/feedback" element={<FeedbackPage />} />
      <Route path="/onboarding/accessibility" element={<AccessibilityPage />} />
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

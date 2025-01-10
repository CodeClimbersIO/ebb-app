import { HashRouter, Route, Routes, Navigate, Outlet } from 'react-router-dom'
import { HomePage } from '@/pages/HomePage'
import { LoginPage } from '@/pages/LoginPage'
import { SignupPage } from '@/pages/SignupPage'
import { FriendsPage } from '@/pages/FriendsPage'
import { SettingsPage } from '@/pages/SettingsPage'
import { StartFlowPage } from './pages/StartFlowPage'
import { useAuth } from './hooks/useAuth'
import { FlowPage } from '@/pages/FlowPage'
import { FlowPeriodApi } from './api/ebbApi/flowPeriodApi'

// Protected Route wrapper component
const ProtectedRoute = () => {
  const { user, loading } = useAuth()

  if (loading) {
    return <div>Loading...</div>
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  FlowPeriodApi.startFlowPeriodScoreJob()

  return <Outlet />
}

export const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />

      {/* Protected routes group */}
      <Route element={<ProtectedRoute />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/friends" element={<FriendsPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/start-flow" element={<StartFlowPage />} />
        <Route path="/flow" element={<FlowPage />} />
      </Route>
    </Routes>
  )
}

export const AppRouter = () => {
  return (
    <HashRouter>
      <AppRoutes />
    </HashRouter>
  )
}

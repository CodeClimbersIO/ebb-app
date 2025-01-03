import { HashRouter } from 'react-router-dom'
import { Route, Routes } from 'react-router-dom'
import { HomePage } from '@/pages/HomePage'
import { LoginPage } from '@/pages/LoginPage'
import { FriendsPage } from '@/pages/FriendsPage'
import { SettingsPage } from '@/pages/SettingsPage'

export const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/friends" element={<FriendsPage />} />
      <Route path="/settings" element={<SettingsPage />} />
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

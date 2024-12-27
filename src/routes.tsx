import { HashRouter } from 'react-router-dom'
import { Route, Routes } from 'react-router-dom'
import { HomePage } from './pages/HomePage'
import { LoginPage } from './pages/LoginPage'

export const AppRoutes = () => {
  return (
    <>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
      </Routes>
    </>
  )
}

const AppRouter = () => {
  return (
    <>
      <HashRouter>
        <AppRoutes />
      </HashRouter>
    </>
  )
}

export { AppRouter }

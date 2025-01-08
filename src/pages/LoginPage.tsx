import { useState } from 'react'
import {
  getAuth, signInWithEmailAndPassword, setPersistence, browserLocalPersistence,
  browserSessionPersistence, sendPasswordResetEmail
} from 'firebase/auth'
import { useNavigate, Link } from 'react-router-dom'

export const LoginPage = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [resetEmail, setResetEmail] = useState('')
  const [resetSuccess, setResetSuccess] = useState('')
  const navigate = useNavigate()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const auth = getAuth()
      // Set persistence based on remember me checkbox
      await setPersistence(auth, rememberMe ? browserLocalPersistence : browserSessionPersistence)
      await signInWithEmailAndPassword(auth, email, password)
      navigate('/')
    } catch (err) {
      setError('Failed to login. Please check your credentials.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setResetSuccess('')

    try {
      const auth = getAuth()
      await sendPasswordResetEmail(auth, resetEmail)
      setResetSuccess('Password reset email sent! Please check your inbox.')
      setResetEmail('')
    } catch (err) {
      setError('Failed to send reset email. Please check the email address.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="max-w-md w-full p-6 bg-white rounded-lg shadow-lg">
        <h2 className="text-2xl font-bold mb-6 text-center">Ebb</h2>
        {error && <p className="text-red-500 mb-4">{error}</p>}
        {resetSuccess && <p className="text-green-500 mb-4">{resetSuccess}</p>}

        <form onSubmit={handleLogin}>
          <div className="mb-4">
            <label className="block mb-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-2 border rounded"
              required
            />
          </div>
          <div className="mb-6">
            <label className="block mb-2">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-2 border rounded"
              required
            />
          </div>
          <div className="mb-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="mr-2"
              />
              <span>Remember me</span>
            </label>
          </div>
          <button
            type="submit"
            className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600 disabled:bg-blue-300"
            disabled={loading}
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-gray-600">
          Don't have an account?{' '}
          <Link to="/signup" className="text-blue-500 hover:text-blue-600">
            Sign up here
          </Link>
        </p>

        {/* Password Reset Form */}
        <div className="mt-4">
          <p className="text-center text-sm text-gray-600 mb-2">Forgot your password?</p>
          <form onSubmit={handlePasswordReset} className="space-y-2">
            <input
              type="email"
              value={resetEmail}
              onChange={(e) => setResetEmail(e.target.value)}
              placeholder="Enter your email"
              className="w-full p-2 border rounded text-sm"
              required
            />
            <button
              type="submit"
              className="w-full bg-gray-500 text-white p-2 rounded hover:bg-gray-600 disabled:bg-gray-300 text-sm"
              disabled={loading}
            >
              Send Reset Link
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

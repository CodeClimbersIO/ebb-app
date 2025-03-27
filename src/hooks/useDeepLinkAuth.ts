import { onOpenUrl } from '@tauri-apps/plugin-deep-link'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import supabase from '@/lib/integrations/supabase'
import { SpotifyAuthService } from '@/lib/integrations/spotify/spotifyAuth'

export const useDeepLinkAuth = () => {
  const navigate = useNavigate()
  const [isHandlingAuth, setIsHandlingAuth] = useState(false)

  useEffect(() => {
    // Check URL parameters immediately
    const urlObj = new URL(window.location.href)
    const hashParams = new URLSearchParams(urlObj.hash.substring(1))
    const searchParams = new URLSearchParams(urlObj.search)

    const accessToken = hashParams.get('access_token') || searchParams.get('access_token')
    const refreshToken = hashParams.get('refresh_token') || searchParams.get('refresh_token')
    const code = searchParams.get('code')
    const state = searchParams.get('state')

    if (accessToken || refreshToken || (code && state)) {
      setIsHandlingAuth(true)
    }

    const handleUrl = async (urls: string[]) => {
      try {
        setIsHandlingAuth(true)
        const url = urls[0]
        
        const urlObj = new URL(url)
        const hashParams = new URLSearchParams(urlObj.hash.substring(1))
        const searchParams = new URLSearchParams(urlObj.search.substring(1))

        // Handle Supabase auth
        const accessToken = hashParams.get('access_token') || searchParams.get('access_token')
        const refreshToken = hashParams.get('refresh_token') || searchParams.get('refresh_token')

        if (accessToken && refreshToken) {
          const { data, error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken
          })
          
          if (error) throw error
          if (data.session) navigate('/')
          return
        }

        // Handle Spotify auth
        const code = searchParams.get('code')
        const state = searchParams.get('state')
        if (code && state) {
          await SpotifyAuthService.handleCallback(code, state)
          navigate('/start-flow', { replace: true })
          window.location.reload()
          return
        }
      } catch (err) {
        console.error('Error handling deep link:', err)
      } finally {
        setIsHandlingAuth(false)
      }
    }

    onOpenUrl(handleUrl)
  }, [navigate])

  return isHandlingAuth
}

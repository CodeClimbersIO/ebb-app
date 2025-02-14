import { onOpenUrl } from '@tauri-apps/plugin-deep-link'
import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import supabase from '@/lib/integrations/supabase'
import { SpotifyService } from '@/lib/integrations/spotify'

export const useDeepLinkAuth = () => {
  const navigate = useNavigate()

  useEffect(() => {
    const handleUrl = async (urls: string[]) => {
      try {
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
          await SpotifyService.handleCallback(code, state)
          navigate('/settings', { 
            state: { spotifyConnected: true }
          })
          return
        }
      } catch (err) {
        console.error('Error handling deep link:', err)
        navigate('/settings', {
          state: { 
            spotifyError: err instanceof Error ? err.message : 'Failed to connect Spotify'
          }
        })
      }
    }

    onOpenUrl(handleUrl)
  }, [navigate])
}

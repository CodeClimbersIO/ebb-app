import { onOpenUrl } from '@tauri-apps/plugin-deep-link'
import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import supabase from '@/lib/utils/supabase'

export const useDeepLinkAuth = () => {
  const navigate = useNavigate()

  useEffect(() => {
    const handleUrl = async (urls: string[]) => {
      try {
        const url = urls[0]
        
        // Parse tokens from the query string
        const urlObj = new URL(url)
        const accessToken = urlObj.searchParams.get('access_token')
        const refreshToken = urlObj.searchParams.get('refresh_token')

        if (accessToken && refreshToken) {
          const { data, error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken
          })
          
          if (error) {
            console.error('Session error:', error)
            throw error
          }
          
          if (data.session) {
            console.log('Session established successfully')
            navigate('/')
          }
        } else {
          throw new Error('Missing required tokens in URL')
        }
      } catch (err) {
        console.error('Error handling deep link:', err)
        navigate('/login')
      }
    }

    onOpenUrl(handleUrl)
  }, [navigate])
}

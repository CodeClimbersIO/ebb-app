import { onOpenUrl } from '@tauri-apps/plugin-deep-link'
import { error } from '@tauri-apps/plugin-log'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import supabase from '@/lib/integrations/supabase'
import { SpotifyAuthService } from '@/lib/integrations/spotify/spotifyAuth'
import { useLicenseStore } from '@/lib/stores/licenseStore'
import { useAuth } from './useAuth'
import { logAndToastError } from '@/lib/utils/ebbError.util'
import { useUpdateProfileLocation } from '@/api/hooks/useProfile'
import { OnboardingUtils } from '@/lib/utils/onboarding.util'

const processedUrls = new Set<string>()

    
export const useDeepLink = () => {
  const navigate = useNavigate()
  const [isHandlingDeepLink, setIsHandlingDeepLink] = useState(false)
  const { user } = useAuth()
  const fetchLicense = useLicenseStore((state) => state.fetchLicense)
  const { mutate: updateProfileLocation } = useUpdateProfileLocation()
  
  useEffect(() => {
    const urlObj = new URL(window.location.href)
    const searchParams = new URLSearchParams(urlObj.search)
    const code = searchParams.get('code')

    if (code) {
      setIsHandlingDeepLink(true)
    }


    const handleUrl = async (urls: string[]) => {
      const url = urls[0]
      try {
        
        // Skip if this URL has already been processed
        if (processedUrls.has(url)) {
          return
        }
        processedUrls.add(url)
        
        setIsHandlingDeepLink(true)
        const urlObj = new URL(url)
        const searchParams = new URLSearchParams(urlObj.search.substring(1))

        // Check if this is a license success callback
        if (url.includes('license/success')) {
          if (user) {
            await fetchLicense(user.id)
          }
          navigate('/')
          return
        }

        if(url.includes('friends')) {
          const requestId = searchParams.get('request_id')
          if(requestId) {
            navigate(`/friends-analytics?request_id=${requestId}`)
          } else {
            navigate('/friends-analytics')
          }
          return
        }

        // Check if this is a Spotify callback
        if (url.includes('spotify/callback')) {
          const spotifyCode = searchParams.get('code')
          const state = searchParams.get('state')
          if (spotifyCode && state) {
            await SpotifyAuthService.handleCallback(spotifyCode, state)
            await updateProfileLocation()
            navigate('/start-flow', { replace: true })
            window.location.reload()
            return
          }
        }

        if (url.includes('slack/callback')) {
          const currentStep = OnboardingUtils.getOnboardingStep()
          if (currentStep === 'slack-onboarding' && !OnboardingUtils.isOnboardingCompleted()) {
            OnboardingUtils.setOnboardingStep('shortcut-tutorial')
            navigate('/onboarding/shortcut-tutorial', { replace: true })
          } else {
            navigate('/settings#slack-integrations', { replace: true })
          }
          window.location.reload()
          return
        }

        const code = searchParams.get('code')
        if (code) {
          const { data, error } = await supabase.auth.exchangeCodeForSession(code)
          if(!OnboardingUtils.isOnboardingCompleted()) {
            OnboardingUtils.setOnboardingStep('accessibility')
          }

          if (error) throw error
          if (data.session) navigate('/')
          return
        }
      } catch (err) {
        processedUrls.delete(url) // Remove the URL from the processed set to allow for retries
        logAndToastError(`Error handling deep link: ${err}`, error)
        error(`Error handling deep link: ${err}`)
      } finally {
        setIsHandlingDeepLink(false)
      }
    }

    onOpenUrl(handleUrl)
  }, [navigate, user, fetchLicense])

  return isHandlingDeepLink
}

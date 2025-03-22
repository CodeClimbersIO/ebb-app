import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Music, Plus, Minus } from 'lucide-react'
import { TopNav } from '@/components/TopNav'
import { Logo } from '@/components/ui/logo'
import { FlowSessionApi } from '../api/ebbApi/flowSessionApi'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { TimeSelector } from '@/components/TimeSelector'
import { AppSelector, SearchOption } from '@/components/AppSelector'
import { SpotifyIcon } from '@/components/icons/SpotifyIcon'
import { AppleMusicIcon } from '@/components/icons/AppleMusicIcon'
import { SpotifyAuthService } from '@/lib/integrations/spotify/spotifyAuth'
import { SpotifyApiService } from '@/lib/integrations/spotify/spotifyApi'
import { BlockingPreferenceApi } from '../api/ebbApi/blockingPreferenceApi'
import { invoke } from '@tauri-apps/api/core'


export const StartFlowPage = () => {
  const [objective, setObjective] = useState('')
  const [duration, setDuration] = useState<number | null>(() => {
    const saved = localStorage.getItem('lastDuration')
    return saved ? JSON.parse(saved) : null
  })
  const [selectedBlocks, setSelectedBlocks] = useState<SearchOption[]>([])

  const [selectedPlaylist, setSelectedPlaylist] = useState(() => {
    const saved = localStorage.getItem('lastPlaylist')
    return saved || ''
  })
  const [isLoading, setIsLoading] = useState(true)
  const [musicService, setMusicService] = useState<{
    type: 'spotify' | 'apple' | null,
    connected: boolean,
    playlists: { id: string, name: string }[]
  }>({
    type: null,
    connected: false,
    playlists: []
  })
  const [spotifyProfile, setSpotifyProfile] = useState<{ email: string; display_name: string | null; product: string } | null>(null)
  const [showBlockingSection, setShowBlockingSection] = useState(false)
  const [showMusicSection, setShowMusicSection] = useState(() => {
    const hashParams = window.location.hash.replace('#', '')
    const searchParams = new URLSearchParams(window.location.search || hashParams.substring(hashParams.indexOf('?')))
    return searchParams.get('expandMusic') === 'true'
  })
  const [playlistData, setPlaylistData] = useState<{
    playlists: { id: string; name: string }[];
    images: Record<string, string>;
  }>(() => {
    const saved = localStorage.getItem('playlistData')
    return saved ? JSON.parse(saved) : { playlists: [], images: {} }
  })
  const navigate = useNavigate()

  useEffect(() => {
    localStorage.setItem('selectedBlocks', JSON.stringify(selectedBlocks))
  }, [selectedBlocks])

  useEffect(() => {
    localStorage.setItem('lastDuration', JSON.stringify(duration))
  }, [duration])

  useEffect(() => {
    localStorage.setItem('lastPlaylist', selectedPlaylist)
  }, [selectedPlaylist])

  // Combine the two separate useEffects into one that handles both initial load
  // and auth callback
  useEffect(() => {
    const handleSpotifyCallback = async () => {
      const hashParams = window.location.hash.replace('#', '')
      const searchParams = new URLSearchParams(window.location.search || hashParams.substring(hashParams.indexOf('?')))
      const code = searchParams.get('code')
      const state = searchParams.get('state')

      if (code && state) {
        try {
          setIsLoading(true)
          await SpotifyAuthService.handleCallback(code, state)
          // Clear URL parameters but keep expandMusic=true
          window.history.replaceState({}, '', '/start-flow?expandMusic=true')
          // Force a full page refresh to get updated Spotify state
          window.location.reload()
          return
        } catch (error) {
          setIsLoading(false)
          throw error
        }
      }

      // Always check connection status after handling callback or on initial load
      await checkSpotifyConnection()
    }

    handleSpotifyCallback()
  }, []) // Run once on mount

  const checkSpotifyConnection = async () => {
    try {
      const isConnected = await SpotifyAuthService.isConnected()

      if (isConnected) {
        const [profile, playlists] = await Promise.all([
          SpotifyApiService.getUserProfile(),
          SpotifyApiService.getUserPlaylists()
        ])

        if (profile) {
          setSpotifyProfile(profile)
          setMusicService({
            type: 'spotify',
            connected: true,
            playlists: playlists
          })
        }
      }

      setIsLoading(false)
    } catch (error) {
      console.error('Error checking Spotify connection:', error)
      setIsLoading(false)
    }
  }

  // Clear the URL parameter after initial load
  useEffect(() => {
    const hashParams = window.location.hash.replace('#', '')
    const searchParams = new URLSearchParams(window.location.search || hashParams.substring(hashParams.indexOf('?')))
    if (searchParams.get('expandMusic')) {
      window.history.replaceState({}, '', '#/start-flow')
    }
  }, [])

  useEffect(() => {
    const loadBlockingPreferences = async () => {
      const prefs = await BlockingPreferenceApi.getBlockingPreferencesAsSearchOptions()
      setSelectedBlocks(prefs)
    }
    loadBlockingPreferences()
  }, [])

  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.key === 'Enter' && event.metaKey && objective) {
        handleBegin()
      }
    }

    document.addEventListener('keydown', handleKeyPress)
    return () => document.removeEventListener('keydown', handleKeyPress)
  }, [objective]) // Re-run when objective changes

  // Load playlists and images once on page load
  useEffect(() => {
    const loadPlaylistData = async () => {
      if (!musicService.connected || musicService.type !== 'spotify') return

      try {
        const playlists = await SpotifyApiService.getUserPlaylists()
        const images: Record<string, string> = {}

        for (const playlist of playlists) {
          const imageUrl = await SpotifyApiService.getPlaylistCoverImage(playlist.id)
          if (imageUrl) {
            images[playlist.id] = imageUrl
          }
        }

        const newPlaylistData = { playlists, images }
        setPlaylistData(newPlaylistData)
        localStorage.setItem('playlistData', JSON.stringify(newPlaylistData))
      } catch (error) {
        console.error('Error loading playlist data:', error)
      }
    }

    loadPlaylistData()
  }, [musicService.connected, musicService.type])

  const handleBegin = async () => {
    if (!objective) return

    await BlockingPreferenceApi.saveBlockingPreferences(selectedBlocks)

    const allBlockedApps = await BlockingPreferenceApi.getAllBlockedApps()
    const blockingApps = allBlockedApps.map(app => ({
      external_id: app.app_external_id,
      is_browser: app.is_browser === 1
    }))
    await invoke('start_blocking', { blockingApps, isBlockList: true })

    const sessionId = await FlowSessionApi.startFlowSession(
      objective,
      duration || undefined,
      selectedBlocks,
    )

    if (!sessionId) {
      throw new Error('No session ID returned from API')
    }

    navigate('/breathing-exercise', {
      state: {
        startTime: Date.now(),
        objective,
        sessionId,
        duration: duration || undefined,
        playlist: selectedPlaylist ? {
          id: selectedPlaylist,
          service: musicService.type
        } : null
      }
    })
  }

  const handleAppSelect = async (option: SearchOption) => {
    const newBlocks = [...selectedBlocks, option]
    await BlockingPreferenceApi.saveBlockingPreferences(newBlocks)
    setSelectedBlocks(newBlocks)
  }

  const handleAppRemove = async (option: SearchOption) => {
    const newBlocks = selectedBlocks.filter(app => {
      if ('category' in option && 'category' in app && option.type === 'category' && app.type === 'category') {
        return app.category !== option.category
      }
      if (option.type === 'app' && app.type === 'app') {
        if (!option.app.is_browser) {
          return app.app.name !== option.app.name
        }
        return app.app.app_external_id !== option.app.app_external_id
      }
      // Handle custom website option
      if (option.type === 'custom' && app.type === 'custom') {
        return app.url !== option.url
      }
      // Handle app vs custom comparison (they might be converted from one to the other)
      if (option.type === 'custom' && app.type === 'app' && app.app.is_browser) {
        return app.app.app_external_id !== option.url
      }
      if (option.type === 'app' && option.app.is_browser && app.type === 'custom') {
        return app.url !== option.app.app_external_id
      }
      return true
    })
    await BlockingPreferenceApi.saveBlockingPreferences(newBlocks)
    setSelectedBlocks(newBlocks)
  }

  const CollapsibleSectionHeader = ({
    title,
    isExpanded,
    onToggle,
    type
  }: {
    title: string,
    isExpanded: boolean,
    onToggle: () => void,
    type: 'blocking' | 'music'
  }) => (
    <div
      className="flex items-center justify-between cursor-pointer"
      onClick={onToggle}
    >
      <h2 className="text-md font-semibold">{title}</h2>
      <div className="flex items-center gap-2">
        {!isExpanded && (
          <span className="text-sm text-muted-foreground truncate max-w-[200px]">
            {type === 'music'
              ? musicService.playlists.find(p => p.id === selectedPlaylist)?.name || 'No playlist selected'
              : 'Applying last used'
            }
          </span>
        )}
        {isExpanded ? (
          <Minus className="h-4 w-4 text-muted-foreground" />
        ) : (
          <Plus className="h-4 w-4 text-muted-foreground" />
        )}
      </div>
    </div>
  )

  const MusicSection = () => (
    <div>
      <CollapsibleSectionHeader
        title="Music"
        isExpanded={showMusicSection}
        onToggle={() => setShowMusicSection(!showMusicSection)}
        type="music"
      />
      {showMusicSection && (
        <div className="mt-4 space-y-4">
          <div className="flex flex-col gap-2">
            {!musicService.connected && (
              <>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => SpotifyAuthService.connect()}
                  disabled={isLoading}
                  size="lg"
                  iconSize={6}
                >
                  <SpotifyIcon />
                  <span className="ml-2">Connect Spotify</span>
                </Button>

                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span>
                        <Button
                          variant="outline"
                          className="w-full"
                          disabled={true}
                          size="lg"
                          iconSize={6}
                        >
                          <AppleMusicIcon />
                          <span className="ml-2">Coming Soon</span>
                        </Button>
                      </span>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Apple Music integration coming soon</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </>
            )}

            {musicService.connected && (
              <>
                <div className="flex items-center gap-2 mb-2">
                  {musicService.type === 'spotify' ? <SpotifyIcon /> : <AppleMusicIcon />}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => navigate('/settings')}
                      className="text-sm text-muted-foreground hover:underline focus:outline-none"
                    >
                      Connected
                    </button>
                    <div className="h-2 w-2 rounded-full bg-green-500" />
                  </div>
                </div>

                {spotifyProfile?.product === 'premium' ? (
                  <Select
                    value={selectedPlaylist}
                    onValueChange={setSelectedPlaylist}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a playlist" />
                    </SelectTrigger>
                    <SelectContent>
                      {playlistData.playlists.map(playlist => (
                        <SelectItem key={playlist.id} value={playlist.id}>
                          <div className="flex items-center">
                            {playlistData.images[playlist.id] ? (
                              <img
                                src={playlistData.images[playlist.id]}
                                alt={playlist.name}
                                className="h-6 w-6 rounded mr-2 object-cover"
                              />
                            ) : (
                              <Music className="h-4 w-4 mr-2" />
                            )}
                            <span className="truncate">{playlist.name}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <button
                    onClick={() => navigate('/settings')}
                    className="text-sm text-destructive hover:underline focus:outline-none"
                  >
                    Error: Spotify Premium required
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )

  return (
    <div className="flex flex-col h-screen">
      <div className="flex">
        <div className="h-14 border-b flex items-center px-2">
          <Logo />
        </div>
        <TopNav variant="modal" />
      </div>
      <div className="flex-1 flex items-center justify-center bg-background/80 backdrop-blur-sm">
        <Card className="w-[400px]">
          <CardContent className="pt-6 space-y-6">
            <div>
              <h2 className="text-md font-semibold mb-4">Goal</h2>
              <Input
                placeholder="What will you focus on?"
                value={objective}
                onChange={(e) => setObjective(e.target.value)}
                maxLength={50}
                className="w-full"
                autoFocus
              />
            </div>

            <div>
              <h2 className="text-md font-semibold mb-4">Duration</h2>
              <TimeSelector
                value={duration}
                onChange={setDuration}
              />
            </div>

            <div>
              <CollapsibleSectionHeader
                title="Blocking"
                isExpanded={showBlockingSection}
                onToggle={() => setShowBlockingSection(!showBlockingSection)}
                type="blocking"
              />
              {showBlockingSection && (
                <div className="mt-4 space-y-4">
                  <AppSelector
                    placeholder="Search apps & websites to block..."
                    emptyText="Enter full URL to add website"
                    selectedApps={selectedBlocks}
                    excludedCategories={[
                      'ai',
                      'browser',
                      'coding',
                      'data/analytics',
                      'designing',
                      'learning',
                      'music/sound',
                      'photo/video',
                      'utilities',
                      'writing'
                    ]}
                    onAppSelect={handleAppSelect}
                    onAppRemove={handleAppRemove}
                  />
                </div>
              )}
            </div>

            <MusicSection />

            <Button
              className="w-full"
              onClick={handleBegin}
              disabled={!objective}
            >
              Start Focus Session
              <div className="ml-2 flex items-center gap-1">
                <kbd className="rounded bg-violet-900 px-1.5 font-mono text-sm">⌘</kbd>
                <kbd className="rounded bg-violet-900 px-1.5 font-mono text-sm">↵</kbd>
              </div>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 

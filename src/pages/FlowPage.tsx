import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { FlowSession } from '@/db/ebb/flowSessionRepo'
import { DateTime, Duration } from 'luxon'
import { FlowSessionApi } from '../api/ebbApi/flowSessionApi'
import type { Difficulty } from '@/components/difficulty-selector/types'
import {
  Card,
  CardContent,
} from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Music, Loader2 } from 'lucide-react'
import { SpotifyIcon } from '@/components/icons/SpotifyIcon'
import { getSpotifyIdFromUri, openSpotifyLink, PlaybackState, SpotifyApiService } from '@/lib/integrations/spotify/spotifyApi'
import { SpotifyAuthService } from '@/lib/integrations/spotify/spotifyAuth'
import { invoke } from '@tauri-apps/api/core'
import NotificationManager from '@/lib/notificationManager'
import { listen } from '@tauri-apps/api/event'
import { useBlockedEvents } from '@/hooks/useBlockedEvents'
import { useFlowTimer } from '../lib/stores/flowTimer'
import { startFlowTimer, stopFlowTimer } from '../lib/tray'
import { DifficultyButton } from '@/components/DifficultyButton'
import { useSpotifyInstallation } from '@/hooks/useSpotifyInstallation'
import { logAndToastError } from '@/lib/utils/ebbError.util'
import { Workflow, WorkflowApi } from '../api/ebbApi/workflowApi'
import { BlockingPreferenceApi } from '../api/ebbApi/blockingPreferenceApi'

const getDurationFormatFromSeconds = (seconds: number) => {
  const duration = Duration.fromMillis(seconds * 1000)
  const format = duration.as('minutes') >= 60 ? 'hh:mm:ss' : 'mm:ss'
  return duration.toFormat(format)
}

const MAX_SESSION_DURATION = 8 * 60 * 60

const Timer = ({ flowSession }: { flowSession: FlowSession | null }) => {
  const [time, setTime] = useState<string>('00:00')
  const [isAddingTime, setIsAddingTime] = useState(false)
  const [cooldown, setCooldown] = useState(false)
  const [hasShownWarning, setHasShownWarning] = useState(false)

  const handleAddTime = async () => {
    if (!flowSession || !flowSession.duration || isAddingTime || cooldown) return

    try {
      setIsAddingTime(true)
      setCooldown(true)

      const additionalSeconds = 15 * 60
      const newTotalDurationInSeconds = flowSession.duration + additionalSeconds

      await FlowSessionApi.updateFlowSessionDuration(flowSession.id, newTotalDurationInSeconds)

      const newTotalDurationForStore = Duration.fromObject({ seconds: newTotalDurationInSeconds })
      useFlowTimer.getState().setTotalDuration(newTotalDurationForStore)

      setHasShownWarning(false)

      flowSession.duration = newTotalDurationInSeconds
    } catch (error) {
      logAndToastError(`Failed to extend session duration: ${error}`, error)
    } finally {
      setIsAddingTime(false)
      setTimeout(() => {
        setCooldown(false)
      }, 1000)
    }
  }

  useEffect(() => {
    if (!flowSession) return

    const updateTimer = () => {
      const now = DateTime.now()
      const nowAsSeconds = now.toSeconds()
      const startTime = DateTime.fromISO(flowSession.start).toSeconds()
      const diff = nowAsSeconds - startTime

      if (!flowSession.duration && diff >= MAX_SESSION_DURATION) {
        window.dispatchEvent(new CustomEvent('flowSessionComplete'))
        return
      }

      if (flowSession.duration) {
        const remaining = (flowSession.duration) - diff
        if (remaining <= 0) {
          window.dispatchEvent(new CustomEvent('flowSessionComplete'))
          return
        }

        if (remaining <= 60 && !hasShownWarning) {
          NotificationManager.getInstance().show({ type: 'session-warning' })
          setHasShownWarning(true)
        }

        const duration = getDurationFormatFromSeconds(remaining)
        setTime(duration)
      } else {
        const duration = getDurationFormatFromSeconds(diff)
        setTime(duration)
      }
    }

    updateTimer()
    const interval = setInterval(updateTimer, 1000)

    return () => clearInterval(interval)
  }, [flowSession, hasShownWarning])

  useEffect(() => {
    const setupListener = async () => {
      const unlisten = await listen<{ action: string, minutes: number }>('add-time-event', (event) => {
        if (event.payload.action === 'add-time') {
          handleAddTime()
        }
      })

      return unlisten
    }

    const unlistenPromise = setupListener()

    return () => {
      unlistenPromise.then(unlisten => unlisten())
    }
  }, [handleAddTime])

  return (
    <>
      <div className="text-sm text-muted-foreground mb-2">{flowSession?.objective}</div>
      <div className="text-6xl font-bold mb-2 font-mono tracking-tight">
        {time}
      </div>
      {flowSession?.duration && (
        <Button
          variant="outline"
          size="sm"
          onClick={handleAddTime}
          className="mt-2"
          disabled={isAddingTime || cooldown}
        >
          {isAddingTime ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Adding time...
            </>
          ) : cooldown ? (
            'Adding...'
          ) : (
            'Add 15 min'
          )}
        </Button>
      )}
    </>
  )
}

type CurrentTrack = {
  song: {
    name: string
    uri: string
    id: string
  }
  artist: {
    name: string
    uri: string
    id: string
  }
  album: {
    name: string
    uri: string
    id: string
  }
  duration_ms: number
  position_ms: number
}

const startTimer = async (flowSession: FlowSession, workflow: Workflow  ) => {
  const duration = workflow.settings.defaultDuration || 0
  useFlowTimer.getState().setTotalDuration(Duration.fromObject({ minutes: duration }))
  await startFlowTimer(DateTime.fromISO(flowSession?.start || ''))
} 

const startBlocking = async (workflow: Workflow) => {
  const blockingApps = workflow.id ? await BlockingPreferenceApi.getWorkflowBlockedApps(workflow.id) : []
  // start blocking
  const isBlockList = !workflow.settings.isAllowList
  await invoke('start_blocking', { blockingApps, isBlockList })
}

export const FlowPage = () => {
  useBlockedEvents()
  const navigate = useNavigate()
  const [flowSession, setFlowSession] = useState<FlowSession | null>(null)
  const [workflow, setWorkflow] = useState<Workflow | null>(null)
  const [isEndingSession, setIsEndingSession] = useState(false)
  const [difficulty, setDifficulty] = useState<Difficulty>()
  const [player, setPlayer] = useState<Spotify.Player | null>(null)
  const [spotifyDeviceId, setSpotifyDeviceId] = useState<string>('')
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTrack, setCurrentTrack] = useState<CurrentTrack | null>(null)
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string>('')
  const [isSpotifyAuthenticated, setIsSpotifyAuthenticated] = useState(false)
  const [playlistData, setPlaylistData] = useState<{
    playlists: { id: string; name: string }[]
    images: Record<string, string>
  }>(() => {
    const saved = localStorage.getItem('playlistData')
    return saved ? JSON.parse(saved) : { playlists: [], images: {} }
  })
  const { isSpotifyInstalled } = useSpotifyInstallation()
  const [clickedButton, setClickedButton] = useState<'prev' | 'play' | 'next' | null>(null)

  useEffect(() => {
    const init = async () => {
      const flowSession = await FlowSessionApi.getInProgressFlowSession()

      if (!flowSession || !flowSession.workflow_id) {
        navigate('/start-flow')
        return
      }
      
      const workflow = await WorkflowApi.getWorkflowById(flowSession.workflow_id)
      if(!workflow) {
        navigate('/start-flow')
        return
      }

      setSelectedPlaylistId(workflow.settings.selectedPlaylist || '')
      setWorkflow(workflow) // this is the workflow that we are using for the flow
      setFlowSession(flowSession || null)
      setDifficulty(workflow?.settings.difficulty || 'medium')

      await startBlocking(workflow)
      await startTimer(flowSession, workflow)

      if (flowSession.type === 'smart') {
        NotificationManager.getInstance().show({
          type: 'session-start-smart'
        })
      } else {
        NotificationManager.getInstance().show({
          type: 'session-start'
        })
      }


    }
    init()
  }, [])

  useEffect(() => {
    const handleSessionComplete = async () => {
      if (player && spotifyDeviceId) {
        await player.pause()
        await SpotifyApiService.transferPlaybackToComputerDevice()
        player.disconnect() // Disconnect the Web Playback SDK player
        setIsPlaying(false)
        setCurrentTrack(null)
        setSelectedPlaylistId('')
      }
      handleEndSession()
    }
    window.addEventListener('flowSessionComplete', handleSessionComplete)

    return () => {
      window.removeEventListener('flowSessionComplete', handleSessionComplete)
    }
  }, [flowSession, player, spotifyDeviceId])

  useEffect(() => {
    const initSpotify = async () => {
      try {
        const isAuthenticated = await SpotifyAuthService.isConnected()
        setIsSpotifyAuthenticated(isAuthenticated)

        if (!isAuthenticated) return

        await SpotifyApiService.initializePlayer()
        const newPlayer = await SpotifyApiService.createPlayer()

        newPlayer.addListener('ready', ({ device_id }: { device_id: string }) => {
          setSpotifyDeviceId(device_id) 
          if (selectedPlaylistId) {
            SpotifyApiService.startPlayback(selectedPlaylistId, device_id)
          }
        })

        newPlayer.addListener('player_state_changed', (state: PlaybackState | null) => {
          if (!state || !state.track_window.current_track) return

          setIsPlaying(!state.paused)
          setCurrentTrack({
            song: {
              name: state.track_window.current_track.name,
              uri: state.track_window.current_track.uri,
              id: state.track_window.current_track.id,
            },
            artist: {
              name: state.track_window.current_track.artists[0].name,
              uri: state.track_window.current_track.artists[0].uri,
              id: getSpotifyIdFromUri(state.track_window.current_track.artists[0].uri),
            },
            album: {
              name: state.track_window.current_track.album.name,
              uri: state.track_window.current_track.album.uri,
              id: getSpotifyIdFromUri(state.track_window.current_track.album.uri),
            },
            duration_ms: state.duration,
            position_ms: state.position
          })
        })

        newPlayer.addListener('not_ready', () => {
          setTimeout(async () => {
            try {
              const isConnected = await SpotifyAuthService.isConnected()
              if (isConnected) {
                newPlayer.connect()
              }
            } catch (error) {
              logAndToastError(`Error reconnecting player: ${error}`, error)
            }
          }, 2000)
        })

        setPlayer(newPlayer)
      } catch (error) {
        logAndToastError(`Failed to initialize Spotify player: ${error}`, error)
      }
    }

    const hasMusic = workflow?.settings.hasMusic
    if (hasMusic) {
      initSpotify()
    }

    return () => {
      player?.disconnect()
    }
  }, [workflow])

  useEffect(() => {
    const loadPlaylistData = async () => {
      if (!isSpotifyAuthenticated) return

      // Use cached data if available
      const cached = localStorage.getItem('playlistData')
      if (cached) {
        const parsedData = JSON.parse(cached)
        setPlaylistData(parsedData)
        return
      }

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
        logAndToastError(`Error loading playlist data: ${error}`, error)
      }
    }

    loadPlaylistData()
  }, [isSpotifyAuthenticated])

  useEffect(() => {
    if (!isSpotifyAuthenticated) return

    // Refresh token every 30 minutes to ensure uninterrupted playback
    const tokenRefreshInterval = setInterval(async () => {
      try {
        await SpotifyAuthService.refreshAccessToken()
      } catch (error) {
        logAndToastError(`Failed to refresh token in interval: ${error}`, error)
      }
    }, 30 * 60 * 1000) // 30 minutes

    return () => clearInterval(tokenRefreshInterval)
  }, [isSpotifyAuthenticated])

  const handleEndSession = async () => {
    if (!flowSession) return

    // Prevent multiple end attempts with countdown button
    if (isEndingSession) return

    setIsEndingSession(true)

    // Stop playback, transfer to computer device, and clear player state
    if (player && spotifyDeviceId) {
      await player.pause()
      await SpotifyApiService.transferPlaybackToComputerDevice()
      player.disconnect() // Disconnect the Web Playback SDK player
      setIsPlaying(false)
      setCurrentTrack(null)
      setSelectedPlaylistId('')
    }

    await invoke('stop_blocking')
    await stopFlowTimer()
    await FlowSessionApi.endFlowSession()

    navigate('/flow-recap', {
      state: {
        sessionId: flowSession.id,
        startTime: flowSession.start,
        endTime: new Date().toISOString(),
        timeInFlow: '00:00',
        idleTime: '0h 34m',
        objective: flowSession.objective
      }
    })
  }

  const handlePlayPause = async () => {
    if (!player) return
    try {
      setClickedButton('play')
      if (isPlaying) {
        await player.pause()
      } else {
        await player.resume()
      }
    } catch (error) {
      logAndToastError(`Playback control error: ${error}`, error)
    } finally {
      setTimeout(() => setClickedButton(null), 200)
    }
  }

  const handleNext = async () => {
    if (!player) return
    try {
      setClickedButton('next')
      await player.nextTrack()
    } catch (error) {
      logAndToastError(`Next track error: ${error}`, error)
    } finally {
      setTimeout(() => setClickedButton(null), 200)
    }
  }

  const handlePrevious = async () => {
    if (!player) return
    try {
      setClickedButton('prev')
      await player.previousTrack()
    } catch (error) {
      logAndToastError(`Previous track error: ${error}`, error)
    } finally {
      setTimeout(() => setClickedButton(null), 200)
    }
  }

  const handlePlaylistChange = async (playlistId: string) => {
    if (!spotifyDeviceId) return
    setSelectedPlaylistId(playlistId)

    // Always save the selected playlist to localStorage
    localStorage.setItem('lastPlaylist', playlistId)
    
    await SpotifyApiService.startPlayback(playlistId, spotifyDeviceId)
  }

  const MusicPlayer = () => (
    <div className="flex flex-col items-center space-y-6">
      <div className="text-center">
        {currentTrack && selectedPlaylistId ? (
          <>
            <a
              href="#"
              onClick={async (e) => {
                e.preventDefault()
                await openSpotifyLink(isSpotifyInstalled, 'track', getSpotifyIdFromUri(currentTrack.song.uri))
              }}
              className="text-2xl font-semibold block hover:underline"
            >
              {currentTrack.song.name}
            </a>
            <a
              href="#"
              onClick={async (e) => {
                e.preventDefault()
                await openSpotifyLink(isSpotifyInstalled, 'artist', getSpotifyIdFromUri(currentTrack.artist.uri))
              }}
              className="text-sm text-muted-foreground block hover:underline"
            >
              {currentTrack.artist.name}
            </a>
            <a
              href="#"
              onClick={async (e) => {
                e.preventDefault()
                await openSpotifyLink(isSpotifyInstalled, 'album', getSpotifyIdFromUri(currentTrack.album.uri))
              }}
              className="text-sm text-muted-foreground block hover:underline"
            >
              {currentTrack.album.name}
            </a>
          </>
        ) : (
          <h3 className="text-2xl font-semibold">
            {selectedPlaylistId ? 'Loading...' : 'Select a playlist'}
          </h3>
        )}
      </div>

      <div className="flex items-center space-x-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={handlePrevious}
          className={clickedButton === 'prev' ? 'scale-90 transition-transform' : 'transition-transform'}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="19 20 9 12 19 4 19 20"></polygon><line x1="5" y1="19" x2="5" y2="5"></line></svg>
        </Button>
        <Button
          size="icon"
          className={`h-12 w-12 ${clickedButton === 'play' ? 'scale-90 transition-transform' : 'transition-transform'}`}
          onClick={handlePlayPause}
        >
          {isPlaying ? (
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect></svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polygon points="10 8 16 12 10 16 10 8"></polygon></svg>
          )}
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleNext}
          className={clickedButton === 'next' ? 'scale-90 transition-transform' : 'transition-transform'}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 4 15 12 5 20 5 4"></polygon><line x1="19" y1="5" x2="19" y2="19"></line></svg>
        </Button>
      </div>
    </div>
  )

  return (
    <div className="flex flex-col h-screen">
      <div className="flex justify-end p-4">
        <DifficultyButton
          variant="destructive"
          onAction={handleEndSession}
          isLoading={isEndingSession}
          loadingText="Ending..."
          actionText="End Early"
          difficulty={difficulty}
        />
      </div>

      <div className="flex-1 flex flex-col items-center justify-center">
        <Timer flowSession={flowSession} />
        {workflow?.settings.hasMusic && isSpotifyAuthenticated && (
          <div className="w-full max-w-lg mx-auto px-4 mb-4 mt-12">
            <Card className="p-6">
              <CardContent className="space-y-12">
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-2">
                    <SpotifyIcon />
                    <a
                      href="#"
                      onClick={async (e) => {
                        e.preventDefault()
                        await openSpotifyLink(isSpotifyInstalled, 'playlist', selectedPlaylistId)
                      }}
                      className="text-sm text-muted-foreground hover:underline cursor-pointer"
                    >
                      {isSpotifyInstalled ? 'Open Spotify' : 'Get Spotify Free'}
                    </a>
                  </div>
                  <Select value={selectedPlaylistId} onValueChange={handlePlaylistChange}>
                    <SelectTrigger className="w-[200px]">
                      <SelectValue placeholder="Select playlist" />
                    </SelectTrigger>
                    <SelectContent className="max-h-[300px] overflow-y-auto">
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
                            {playlist.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <MusicPlayer />
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}

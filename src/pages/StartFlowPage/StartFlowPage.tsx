import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { TopNav } from '@/components/TopNav'
import { TimeSelector } from '@/components/TimeSelector'
import { WorkflowSelector } from '@/components/WorkflowSelector'
import { WorkflowApi, type Workflow } from '@/api/ebbApi/workflowApi'
import { Duration } from 'luxon'
import { getDurationFromDefault } from '@/lib/stores/flowTimer'
import { MusicSelector } from '@/components/MusicSelector'
import { AppSelector, type SearchOption } from '@/components/AppSelector'
import { AlertCircle } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { SpotifyApiService } from '@/lib/integrations/spotify/spotifyApi'
import { logAndToastError } from '@/lib/utils/ebbError.util'
import { error as logError } from '@tauri-apps/plugin-log'
import { BlockingPreferenceApi } from '@/api/ebbApi/blockingPreferenceApi'
import { usePostHog } from 'posthog-js/react'
import { Input } from '@/components/ui/input'
import { FlowSessionApi } from '@/api/ebbApi/flowSessionApi'
import { SmartFocusSelector } from '@/pages/StartFlowPage/SmartFocusSelector'
import { SlackFocusToggle } from '@/components/SlackFocusToggle'

export const StartFlowPage = () => {
  const [duration, setDuration] = useState<Duration | null>(null)
  const [selectedWorkflowId, setSelectedWorkflowId] = useState<string | null>(null)
  const [selectedWorkflow, setSelectedWorkflow] = useState<Workflow | null>(null)
  const [selectedPlaylist, setSelectedPlaylist] = useState<string | null>(null)
  const [selectedApps, setSelectedApps] = useState<SearchOption[]>([])
  const [objective, setObjective] = useState<string>('')
  const [isAllowList, setIsAllowList] = useState(false)
  const [workflows, setWorkflows] = useState<Workflow[]>([])
  const [hasMusic, setHasMusic] = useState(true)
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard' | null>(null)
  const [spotifyProfile, setSpotifyProfile] = useState<{
    email: string
    display_name: string | null
    product?: string
  } | null>(null)
  const posthog = usePostHog()

  useEffect(() => {
    const loadWorkflows = async () => {
      try {
        const loadedWorkflows = await WorkflowApi.getWorkflows()
        setWorkflows(loadedWorkflows)
        
        if (loadedWorkflows.length === 0) {
          // First session defaults
          setDuration(Duration.fromObject({ minutes: 30 }))

          try {
            const defaultSearchOptions = await BlockingPreferenceApi.getDefaultSearchOptions()
            setSelectedApps(defaultSearchOptions) 
          } catch (tagError) {
            logAndToastError(`Failed to load default categories: ${tagError}`, tagError)
            setSelectedApps([]) 
          }

        } else {
          const mostRecentWorkflow = loadedWorkflows.reduce((prev, current) => {
            return (prev.lastSelected || 0) > (current.lastSelected || 0) ? prev : current
          }, loadedWorkflows[0])

          setSelectedWorkflowId(mostRecentWorkflow.id || null)
          setSelectedWorkflow(mostRecentWorkflow)
          setDuration(getDurationFromDefault(mostRecentWorkflow.settings.defaultDuration))
          setSelectedPlaylist(mostRecentWorkflow.settings.selectedPlaylist || null)
          setSelectedApps(mostRecentWorkflow.selectedApps || [])
          setIsAllowList(mostRecentWorkflow.settings.isAllowList || false)
          setHasMusic(mostRecentWorkflow.settings.hasMusic ?? true)
          setDifficulty(mostRecentWorkflow.settings.difficulty || null)
        }
      } catch (error) {
        logAndToastError(`Failed to load workflows: ${error}`, error)
      }
    }

    loadWorkflows()
  }, [setDuration])



  useEffect(() => {
    const checkSpotifyProfile = async () => {
      try {
        const profile = await SpotifyApiService.getUserProfile()
        if (profile) {
          setSpotifyProfile(profile)
        }
      } catch (error) {
        logError(`Error checking Spotify profile: ${error}`)
      }
    }
    checkSpotifyProfile()
  }, [])

  const saveChanges = useCallback(async () => {
    if (!selectedWorkflow?.id) return

    const updatedWorkflow: Workflow = {
      ...selectedWorkflow,
      selectedApps,
      settings: {
        ...selectedWorkflow.settings,
        selectedPlaylist,
        selectedPlaylistName: selectedWorkflow.settings.selectedPlaylistName,
        defaultDuration: duration?.as('minutes') ?? null,
        isAllowList,
        hasMusic,
        difficulty
      }
    }

    try {
      await WorkflowApi.saveWorkflow(updatedWorkflow)
    } catch (error) {
      logAndToastError(`Failed to save workflow changes: ${error}`, error)
    }
  }, [duration, selectedPlaylist, selectedApps, isAllowList, selectedWorkflow, hasMusic, difficulty])

  useEffect(() => {
    if (selectedWorkflow?.id) {
      const timeoutId = setTimeout(() => {
        saveChanges()
      }, 150)
      return () => clearTimeout(timeoutId)
    }
  }, [selectedWorkflow, duration, selectedPlaylist, selectedApps, isAllowList, hasMusic, saveChanges])

  const handleWorkflowSelect = async (workflowId: string) => {
    try {
      setSelectedWorkflowId(workflowId)
      
      const workflow = await WorkflowApi.getWorkflowById(workflowId)
      if (workflow) {
        setSelectedWorkflow(workflow)
        setDuration(getDurationFromDefault(workflow.settings.defaultDuration))
        setSelectedPlaylist(workflow.settings.selectedPlaylist || null)
        setSelectedApps(workflow.selectedApps || [])
        setIsAllowList(workflow.settings.isAllowList || false)
        setHasMusic(workflow.settings.hasMusic ?? true)
        setDifficulty(workflow.settings.difficulty || null)
      }
    } catch (error) {
      logAndToastError(`Failed to select workflow: ${error}`, error)
    }
  }

  useEffect(() => {
    if (selectedWorkflowId) {
      const refreshWorkflow = async () => {
        try {
          const workflow = await WorkflowApi.getWorkflowById(selectedWorkflowId)
          if (workflow) {
            setSelectedWorkflow(workflow)
          }
        } catch (error) {
          logAndToastError(`Failed to refresh workflow: ${error}`, error)
        }
      }
      refreshWorkflow()
    }
  }, [selectedWorkflowId])

  const handleSettingsChange = (workflowId: string, newSettings: Workflow['settings']) => {
    if (workflowId === selectedWorkflowId) {
      setHasMusic(newSettings.hasMusic ?? true)
    }
  }




  const handleBegin = async () => {
    try {
      let workflowId = selectedWorkflowId
      let currentWorkflow = selectedWorkflow

      // Track flow session start with PostHog
      posthog.capture('flow_session_started', {
        duration_minutes: duration?.as('minutes') ?? null,
        is_allowlist: isAllowList,
        difficulty: difficulty,
        has_music: hasMusic,
        selected_categories: selectedApps.map(app => {
          if (app.type === 'app') {
            return {
              type: 'app',
              name: app.app.name,
              is_browser: app.app.is_browser === 1
            }
          } else if (app.type === 'category') {
            return {
              type: 'category',
              name: app.category
            }
          } else {
            return {
              type: 'custom',
              name: app.url
            }
          }
        })
      })

      // If first session (no workflows), create one from current settings
      if (workflows.length === 0) {
        const newWorkflow: Workflow = {
          name: 'New Profile',
          selectedApps,
          lastSelected: Date.now(),
          settings: {
            selectedPlaylist,
            selectedPlaylistName: currentWorkflow?.settings.selectedPlaylistName,
            defaultDuration: duration?.as('minutes') ?? null,
            isAllowList,
            hasBreathing: true,
            hasMusic,
            typewriterMode: false,
            difficulty,
          },
        }

        try {
          const savedWorkflow = await WorkflowApi.saveWorkflow(newWorkflow)
          setWorkflows([savedWorkflow])
          workflowId = savedWorkflow.id || null
          currentWorkflow = savedWorkflow
          setSelectedWorkflowId(workflowId)
          setSelectedWorkflow(currentWorkflow)
        } catch (error) {
          logAndToastError(`Failed to save first workflow: ${error}`, error)
          return
        }
      } else if (workflowId) {
        await WorkflowApi.updateLastSelected(workflowId)
      }

      if (!workflowId || !currentWorkflow) {
        throw new Error('No workflow found')
      }

      // Create workflow with current state to ensure latest settings are used
      const workflowWithCurrentState: Workflow = {
        ...currentWorkflow,
        selectedApps,
        settings: {
          ...currentWorkflow.settings,
          selectedPlaylist,
          selectedPlaylistName: currentWorkflow.settings.selectedPlaylistName,
          defaultDuration: duration?.as('minutes') ?? null,
          isAllowList,
          hasMusic,
          difficulty
        }
      }

      await FlowSessionApi.startFlowSession(objective || currentWorkflow.name, 'manual', workflowWithCurrentState)

    } catch (error) {
      logAndToastError(`Failed to start flow session: ${error}`, error)
    }
  }

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault()
        handleBegin()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleBegin])

  return (
    <div className="flex flex-col h-screen">
      <TopNav variant="modal" />
      <div className="flex-1 flex items-center justify-center bg-background/80 backdrop-blur-sm">
        <Card className="w-[420px]">
          <CardContent className="pt-6 space-y-6">
            {workflows.length > 0 && (
              <motion.div
                layout
                transition={{ 
                  type: 'spring',
                  stiffness: 300,
                  damping: 30
                }}
              >
                <WorkflowSelector 
                  selectedId={selectedWorkflowId} 
                  onSelect={handleWorkflowSelect}
                  onSettingsChange={handleSettingsChange}
                />
              </motion.div>
            )}

            <div>
              <AppSelector
                selectedApps={selectedApps}
                onAppSelect={(app) => setSelectedApps([...selectedApps, app])}
                onAppRemove={(app) => setSelectedApps(selectedApps.filter(a => 
                  a.type === 'app' && app.type === 'app' 
                    ? a.app.app_external_id !== app.app.app_external_id
                    : a !== app
                ))}
                isAllowList={isAllowList}
                onIsAllowListChange={setIsAllowList}
                difficulty={difficulty}
                onDifficultyChange={setDifficulty}
              />
            </div>

            {spotifyProfile && spotifyProfile.product !== 'premium' && (
              <Alert variant="destructive" className="bg-red-950 border-red-900">
                <AlertCircle className="h-4 w-4 text-red-400" />
                <AlertDescription className="text-red-400">
                  Error: Spotify Premium is required to use this integration
                </AlertDescription>
              </Alert>
            )}
            
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <TimeSelector
                  value={duration?.as('minutes') ?? null}
                  onChange={(value) => setDuration(value ? Duration.fromObject({ minutes: value }) : null)}
                />
              </div>
              <div className="flex items-center gap-2">
                {workflows.length > 0 && (
                  <SmartFocusSelector workflows={workflows} />
                )}
                <SlackFocusToggle />
              </div>
            </div>

            {hasMusic && (
              <div>
                <MusicSelector
                  selectedPlaylist={selectedPlaylist}
                  onPlaylistSelect={(playlist) => {
                    setSelectedPlaylist(playlist.id)
                  }}
                />
              </div>
            )}

            <div className="flex items-center gap-4">
              <div className="flex-1">
                <Input
                  placeholder="What will you focus on?"
                  value={objective}
                  onChange={(e) => setObjective(e.target.value)}
                  maxLength={50}
                  className="w-full"
                  autoFocus
                />
              </div>
            </div>


            <Button
              className="w-full"
              onClick={handleBegin}
            >
              Start Focus
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

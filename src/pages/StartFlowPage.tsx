import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'motion/react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { TopNav } from '@/components/TopNav'
import { FlowSessionApi } from '../api/ebbApi/flowSessionApi'
import { TimeSelector } from '@/components/TimeSelector'
import { WorkflowSelector } from '@/components/WorkflowSelector'
import { WorkflowApi, type Workflow } from '@/api/ebbApi/workflowApi'
import { invoke } from '@tauri-apps/api/core'
import { DateTime, Duration } from 'luxon'
import { startFlowTimer } from '../lib/tray'
import { getDurationFromDefault, useFlowTimer } from '../lib/stores/flowTimer'
import { MusicSelector } from '@/components/MusicSelector'
import { AppSelector, type SearchOption } from '@/components/AppSelector'
import { App, AppRepo } from '../db/monitor/appRepo'
import { Tag } from '../db/monitor/tagRepo'
import { AlertCircle } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { SpotifyApiService } from '@/lib/integrations/spotify/spotifyApi'
import { TypewriterModeToggle } from '@/components/TypewriterModeToggle'
import { logAndToastError } from '@/lib/utils/logAndToastError'

export const StartFlowPage = () => {
  const { duration, setDuration } = useFlowTimer()
  const [selectedWorkflowId, setSelectedWorkflowId] = useState<string | null>(null)
  const [selectedWorkflow, setSelectedWorkflow] = useState<Workflow | null>(null)
  const [selectedPlaylist, setSelectedPlaylist] = useState<string | null>(null)
  const [selectedApps, setSelectedApps] = useState<SearchOption[]>([])
  const [isAllowList, setIsAllowList] = useState(false)
  const [hasBreathing, setHasBreathing] = useState(true)
  const [typewriterMode, setTypewriterMode] = useState(false)
  const [workflows, setWorkflows] = useState<Workflow[]>([])
  const [hasMusic, setHasMusic] = useState(true)
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard' | null>(null)
  const [spotifyProfile, setSpotifyProfile] = useState<{
    email: string
    display_name: string | null
    product?: string
  } | null>(null)
  const navigate = useNavigate()

  useEffect(() => {
    const loadWorkflows = async () => {
      try {
        const loadedWorkflows = await WorkflowApi.getWorkflows()
        setWorkflows(loadedWorkflows)
        
        if (loadedWorkflows.length > 0) {
          const mostRecentWorkflow = loadedWorkflows.reduce((prev, current) => {
            return (prev.lastSelected || 0) > (current.lastSelected || 0) ? prev : current
          }, loadedWorkflows[0])

          setSelectedWorkflowId(mostRecentWorkflow.id || null)
          setSelectedWorkflow(mostRecentWorkflow)
          setDuration(getDurationFromDefault(mostRecentWorkflow.settings.defaultDuration))
          setSelectedPlaylist(mostRecentWorkflow.selectedPlaylist || null)
          setSelectedApps(mostRecentWorkflow.selectedApps || [])
          setIsAllowList(mostRecentWorkflow.settings.isAllowList || false)
          setHasBreathing(mostRecentWorkflow.settings.hasBreathing ?? true)
          setTypewriterMode(mostRecentWorkflow.settings.typewriterMode ?? false)
          setHasMusic(mostRecentWorkflow.settings.hasMusic ?? true)
          setDifficulty(mostRecentWorkflow.settings.difficulty || null)
        }
      } catch (error) {
        logAndToastError(`Failed to load workflows: ${error}`)
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
        logAndToastError(`Error checking Spotify profile: ${error}`)
      }
    }
    checkSpotifyProfile()
  }, [])

  const saveChanges = useCallback(async () => {
    if (!selectedWorkflow?.id) return

    const updatedWorkflow: Workflow = {
      ...selectedWorkflow,
      selectedApps,
      selectedPlaylist,
      selectedPlaylistName: selectedWorkflow.selectedPlaylistName,
      settings: {
        ...selectedWorkflow.settings,
        defaultDuration: duration?.as('minutes') ?? null,
        isAllowList,
        hasBreathing,
        typewriterMode,
        hasMusic,
        difficulty
      }
    }

    try {
      await WorkflowApi.saveWorkflow(updatedWorkflow)
    } catch (error) {
      logAndToastError(`Failed to save workflow changes: ${error}`)
    }
  }, [duration, selectedPlaylist, selectedApps, isAllowList, selectedWorkflow, hasBreathing, typewriterMode, hasMusic, difficulty])

  useEffect(() => {
    if (selectedWorkflow?.id) {
      const timeoutId = setTimeout(() => {
        saveChanges()
      }, 150)
      return () => clearTimeout(timeoutId)
    }
  }, [selectedWorkflow, duration, selectedPlaylist, selectedApps, isAllowList, hasBreathing, typewriterMode, hasMusic, saveChanges])

  const handleWorkflowSelect = async (workflowId: string) => {
    try {
      setSelectedWorkflowId(workflowId)
      
      const workflow = await WorkflowApi.getWorkflowById(workflowId)
      if (workflow) {
        setSelectedWorkflow(workflow)
        setDuration(getDurationFromDefault(workflow.settings.defaultDuration))
        setSelectedPlaylist(workflow.selectedPlaylist || null)
        setSelectedApps(workflow.selectedApps || [])
        setIsAllowList(workflow.settings.isAllowList || false)
        setHasBreathing(workflow.settings.hasBreathing ?? true)
        setTypewriterMode(workflow.settings.typewriterMode ?? false)
        setHasMusic(workflow.settings.hasMusic ?? true)
        setDifficulty(workflow.settings.difficulty || null)
      }
    } catch (error) {
      logAndToastError(`Failed to select workflow: ${error}`)
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
          logAndToastError(`Failed to refresh workflow: ${error}`)
        }
      }
      refreshWorkflow()
    }
  }, [selectedWorkflowId])

  const handleSettingsChange = (workflowId: string, newSettings: Workflow['settings']) => {
    if (workflowId === selectedWorkflowId) {
      setHasMusic(newSettings.hasMusic ?? true)
      setHasBreathing(newSettings.hasBreathing ?? true)
    }
  }

  const handleBegin = async () => {
    try {
      let workflowId = selectedWorkflowId // Use let as it might be updated
      let currentWorkflow = selectedWorkflow // Use let as it might be updated
      const workflowName = currentWorkflow?.name || 'Focus Session'

      // If this is the first session (no workflows), create one from current settings
      if (workflows.length === 0) {
        const newWorkflow: Workflow = {
          name: 'New Profile',
          selectedApps, // Use current state
          selectedPlaylist,
          selectedPlaylistName: currentWorkflow?.selectedPlaylistName, // Get name if possible
          lastSelected: Date.now(),
          settings: {
            defaultDuration: duration?.as('minutes') ?? null,
            isAllowList, // Use current state
            hasBreathing,
            typewriterMode,
            hasMusic,
            difficulty,
          }
        }

        try {
          const savedWorkflow = await WorkflowApi.saveWorkflow(newWorkflow)
          setWorkflows([savedWorkflow])
          workflowId = savedWorkflow.id || null // Update workflowId for sessionState
          currentWorkflow = savedWorkflow // Update currentWorkflow for sessionState
          setSelectedWorkflowId(workflowId)
          setSelectedWorkflow(currentWorkflow)
        } catch (error) {
          logAndToastError(`Failed to save first workflow: ${error}`)
          return // Exit if saving fails
        }
      } else if (workflowId) {
        // If it's an existing workflow, update its lastSelected timestamp
        await WorkflowApi.updateLastSelected(workflowId)
      }

      // --- Corrected Blocking Logic --- 
      // Resolve apps from both direct selections and categories based on current state
      const directAppSelections: App[] = selectedApps
        .filter((option): option is Extract<SearchOption, { type: 'app' }> => option.type === 'app' && !!option.app)
        .map(option => option.app)

      const categorySelections: Tag[] = selectedApps
        .filter((option): option is Extract<SearchOption, { type: 'category' }> => option.type === 'category' && !!option.tag)
        .map(option => option.tag)

      const categoryTagIds = categorySelections.map(tag => tag.id).filter(id => id) as string[] // Ensure IDs exist

      // Fetch apps belonging to the selected categories
      const appsFromCategories = categoryTagIds.length > 0 
        ? await AppRepo.getAppsByCategoryTags(categoryTagIds) 
        : []

      // Combine direct selections and category-derived apps
      const allAppsToConsider = [...directAppSelections, ...appsFromCategories]

      // Remove duplicates using a Map based on app ID
      const uniqueAppsMap = new Map<string, App>()
      allAppsToConsider.forEach(app => {
        if (app && app.id) { // Check if app and app.id are defined
          uniqueAppsMap.set(app.id, app)
        }
      })
      const uniqueAppsToBlock = Array.from(uniqueAppsMap.values())

      // Map to the format required by invoke
      const blockingApps = uniqueAppsToBlock.map((app: App) => ({
        external_id: app.app_external_id,
        is_browser: app.is_browser === 1
      }))

      const isBlockList = !isAllowList // Use current state value
      // --- End Corrected Blocking Logic ---

      const sessionId = await FlowSessionApi.startFlowSession(
        workflowName,
        duration ? duration.as('minutes') : undefined
      )
      
      const totalDurationForStore = duration ? Duration.fromObject({ minutes: duration.as('minutes') }) : null
      useFlowTimer.getState().setTotalDuration(totalDurationForStore)
      useFlowTimer.getState().setDuration(null)

      if (!sessionId) {
        throw new Error('No session ID returned from API')
      }

      await startFlowTimer(DateTime.now())

      // Use potentially updated workflowId and currentWorkflow details
      const sessionState = {
        startTime: Date.now(),
        objective: workflowName,
        sessionId,
        duration: duration ? duration.as('minutes') : undefined,
        workflowId, 
        hasBreathing,
        hasMusic,
        selectedPlaylist,
        selectedPlaylistName: currentWorkflow?.selectedPlaylistName, 
        difficulty
      }

      // Invoke blocking with apps derived from state (including categories)
      await invoke('start_blocking', { blockingApps, isBlockList, typewriterMode })

      if (!hasBreathing) {
        navigate('/flow', { state: sessionState })
      } else {
        navigate('/breathing-exercise', { state: sessionState })
      }
    } catch (error) {
      logAndToastError(`Failed to start flow session: ${error}`)
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
                <TimeSelector
                  value={duration?.as('minutes') ?? null}
                  onChange={(value) => setDuration(value ? Duration.fromObject({ minutes: value }) : null)}
                />
              </div>
              <div className="flex items-center gap-2">
                <TypewriterModeToggle
                  typewriterMode={typewriterMode}
                  onToggle={(value) => setTypewriterMode(value)}
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

import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'motion/react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { TopNav } from '@/components/TopNav'
import { Logo } from '@/components/ui/logo'
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
import { BlockingPreferenceApi } from '../api/ebbApi/blockingPreferenceApi'
import { App } from '../db/monitor/appRepo'

// Local storage key for preferences when no workflow is selected
export const LOCAL_STORAGE_PREFERENCES_KEY = 'flow-preferences'

export const StartFlowPage = () => {
  const { duration, setDuration } = useFlowTimer()
  const [selectedWorkflowId, setSelectedWorkflowId] = useState<string | null>(null)
  const [selectedWorkflow, setSelectedWorkflow] = useState<Workflow | null>(null)
  const [showHint, setShowHint] = useState(false)
  const [selectedPlaylist, setSelectedPlaylist] = useState<string | null>(null)
  const [selectedApps, setSelectedApps] = useState<SearchOption[]>([])
  const [isAllowList, setIsAllowList] = useState(false)
  const navigate = useNavigate()

  // Auto-save changes to either workflow or local storage
  const saveChanges = useCallback(async () => {
    if (selectedWorkflow?.id && selectedWorkflowId) {
      // Save to workflow
      const updatedWorkflow: Workflow = {
        ...selectedWorkflow,
        selectedApps,
        selectedPlaylist,
        selectedPlaylistName: selectedWorkflow.selectedPlaylistName,
        settings: {
          ...selectedWorkflow.settings,
          defaultDuration: duration?.as('minutes') ?? null,
          isAllowList
        }
      }

      try {
        await WorkflowApi.saveWorkflow(updatedWorkflow)
      } catch (error) {
        console.error('Failed to save workflow changes:', error)
      }
    } else {
      // Save to local storage when no workflow is selected
      const preferences = {
        duration: duration?.as('minutes') ?? null,
        selectedPlaylist,
        selectedApps,
        isAllowList
      }
      localStorage.setItem(LOCAL_STORAGE_PREFERENCES_KEY, JSON.stringify(preferences))
    }
  }, [duration, selectedPlaylist, selectedApps, isAllowList, selectedWorkflow, selectedWorkflowId])

  // Compare current settings with workflow defaults and trigger auto-save
  useEffect(() => {
    if (!selectedWorkflow) {
      // When no workflow is selected, just save to local storage
      const timeoutId = setTimeout(() => {
        saveChanges()
      }, 150)
      return () => clearTimeout(timeoutId)
    }

    const initialState = JSON.stringify({
      duration: selectedWorkflow.settings.defaultDuration,
      selectedPlaylist: selectedWorkflow.selectedPlaylist,
      selectedApps: selectedWorkflow.selectedApps,
      isAllowList: selectedWorkflow.settings.isAllowList
    })
    
    const currentState = JSON.stringify({
      duration,
      selectedPlaylist,
      selectedApps,
      isAllowList
    })
    
    const hasChanges = initialState !== currentState
    
    if (hasChanges) {
      const timeoutId = setTimeout(() => {
        saveChanges()
      }, 150)
      return () => clearTimeout(timeoutId)
    }
  }, [selectedWorkflow, duration, selectedPlaylist, selectedApps, isAllowList, saveChanges])

  // Load preferences from local storage when no workflow is selected
  useEffect(() => {
    if (!selectedWorkflow) {
      const savedPreferences = localStorage.getItem(LOCAL_STORAGE_PREFERENCES_KEY)
      if (savedPreferences) {
        try {
          const preferences = JSON.parse(savedPreferences)
          setDuration(preferences.duration !== null ? Duration.fromObject({ minutes: preferences.duration }) : null)
          setSelectedPlaylist(preferences.selectedPlaylist)
          setSelectedApps(preferences.selectedApps)
          setIsAllowList(preferences.isAllowList ?? false) // Add default value
        } catch (error) {
          console.error('Failed to parse local preferences:', error)
        }
      }
    }
  }, [selectedWorkflow])

  // Handle workflow switching
  const switchWorkflow = async (direction: 'left' | 'right') => {
    try {
      const workflows = await WorkflowApi.getWorkflows()
      if (workflows.length <= 1) return

      const currentIndex = workflows.findIndex(w => w.id === selectedWorkflowId)
      let newIndex

      if (direction === 'left') {
        newIndex = currentIndex <= 0 ? workflows.length - 1 : currentIndex - 1
      } else {
        newIndex = currentIndex >= workflows.length - 1 ? 0 : currentIndex + 1
      }

      const newWorkflow = workflows[newIndex]
      const newWorkflowId = newWorkflow.id
      
      if (newWorkflowId) {
        setSelectedWorkflowId(newWorkflowId)
      }

      // Set initial selection to the workflow's default duration
      setDuration(getDurationFromDefault(workflows[newIndex].settings.defaultDuration))
    } catch (error) {
      console.error('Failed to switch workflow:', error)
    }
  }

  // Set initial workflow and check for hint display
  useEffect(() => {
    const loadInitialWorkflow = async () => {
      try {
        const workflows = await WorkflowApi.getWorkflows()
        if (workflows.length > 0) {
          const initialWorkflow = workflows[0]
          const initialWorkflowId = initialWorkflow.id
          if (initialWorkflowId) {
            setSelectedWorkflowId(initialWorkflowId)
  setSelectedWorkflow(initialWorkflow)
            // Update to use store's setDuration
            setDuration(getDurationFromDefault(initialWorkflow.settings.defaultDuration))
            // Set initial music preferences
            setSelectedPlaylist(initialWorkflow.selectedPlaylist || null)
            // Set initial blocking preferences
            setSelectedApps(initialWorkflow.selectedApps || [])
            // Set initial allow list preference
            setIsAllowList(initialWorkflow.settings.isAllowList || false)
          }

          // Only show hint if there are 2+ workflows and it hasn't been dismissed
          if (workflows.length >= 2 && localStorage.getItem('workflowHintShown') !== 'true') {
            setShowHint(true)
          }
        }
      } catch (error) {
        console.error('Failed to load initial workflow:', error)
      }
    }

    loadInitialWorkflow()

    // Add listener for workflow saved event
    const handleWorkflowSaved = async () => {
      const workflows = await WorkflowApi.getWorkflows()
      if (workflows.length >= 2 && localStorage.getItem('workflowHintShown') !== 'true') {
        setShowHint(true)
      }
    }

    window.addEventListener('workflowSaved', handleWorkflowSaved)
    return () => window.removeEventListener('workflowSaved', handleWorkflowSaved)
  }, [setDuration])

  // Update workflow selection in WorkflowSelector
  const handleWorkflowSelect = async (workflowId: string) => {
    try {
      setSelectedWorkflowId(workflowId)
      
      // Get the full workflow data
      const workflow = await WorkflowApi.getWorkflowById(workflowId)
      if (workflow) {
        setSelectedWorkflow(workflow)
        // Set duration from workflow's default duration
        setDuration(getDurationFromDefault(workflow.settings.defaultDuration))
        // Set music preferences
        setSelectedPlaylist(workflow.selectedPlaylist || null)
        // Set blocking preferences
        setSelectedApps(workflow.selectedApps || [])
        // Set allow list preference
        setIsAllowList(workflow.settings.isAllowList || false)
      }
    } catch (error) {
      console.error('Failed to select workflow:', error)
    }
  }

  // Add keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
        handleBegin()
      } else if (event.key === 'ArrowLeft') {
        switchWorkflow('left')
      } else if (event.key === 'ArrowRight') {
        switchWorkflow('right')
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selectedWorkflowId, duration])

  const handleBegin = async () => {
    try {
      let blockingApps
      let isBlockList

      // Check if we have any workflows at all
      const workflows = await WorkflowApi.getWorkflows()
      const hasWorkflows = workflows.length > 0

      // If selectedWorkflowId is set but no workflows exist, clear it
      if (selectedWorkflowId && !hasWorkflows) {
        setSelectedWorkflowId(null)
      }

      if (selectedWorkflowId && hasWorkflows) {
        // Workflow case
        const workflow = await WorkflowApi.getWorkflowById(selectedWorkflowId)
        if (!workflow) {
          throw new Error('Selected workflow not found')
        }

        // Get blocked apps for this workflow
        const blockedApps = await BlockingPreferenceApi.getWorkflowBlockedApps(selectedWorkflowId)
        blockingApps = blockedApps.map((app: App) => ({
          external_id: app.app_external_id,
          is_browser: app.is_browser === 1
        }))
        isBlockList = !workflow.settings.isAllowList

        // Update lastSelected timestamp
        await WorkflowApi.updateLastSelected(selectedWorkflowId)

        const sessionId = await FlowSessionApi.startFlowSession(
          workflow.name,
          duration ? duration.as('minutes') : undefined
        )

        if (!sessionId) {
          throw new Error('No session ID returned from API')
        }

      await startFlowTimer(DateTime.now())

        const sessionState = {
          startTime: Date.now(),
          objective: workflow.name,
          sessionId,
          duration: duration ? duration.as('minutes') : undefined,
          workflowId: selectedWorkflowId,
          hasBreathing: workflow.settings.hasBreathing,
          hasTypewriter: workflow.settings.hasTypewriter,
          hasMusic: workflow.settings.hasMusic,
          selectedPlaylist: workflow.selectedPlaylist,
          selectedPlaylistName: workflow.selectedPlaylistName
        }

        // Start blocking
        await invoke('start_blocking', { blockingApps, isBlockList })

  
        if (!workflow.settings.hasBreathing) {
          navigate('/session', { state: sessionState })
        } else {
          navigate('/breathing-exercise', { state: sessionState })
        }
      } else {
        // Non-workflow case
        // Get blocked apps from local storage preferences
        const blockedApps = await BlockingPreferenceApi.getBlockedAppsFromLocalPreferences()
        blockingApps = blockedApps.map((app: App) => ({
          external_id: app.app_external_id,
          is_browser: app.is_browser === 1
        }))
        isBlockList = !isAllowList

        // Save selected playlist to localStorage for FlowPage to access
        if (selectedPlaylist) {
          localStorage.setItem('lastPlaylist', selectedPlaylist)
        }

        const sessionId = await FlowSessionApi.startFlowSession(
          'Focus Session',
          duration ? duration.as('minutes') : undefined
        )

        if (!sessionId) {
          throw new Error('No session ID returned from API')
        }

        const sessionState = {
          startTime: Date.now(),
          objective: 'Focus Session',
          sessionId,
          duration: duration ? duration.as('minutes') : undefined,
          workflowId: null,
          hasBreathing: true, // Enable breathing by default
          hasTypewriter: false,
          hasMusic: true,
          selectedPlaylist: selectedPlaylist,
          selectedPlaylistName: undefined
        }

        // Start blocking
        await invoke('start_blocking', { blockingApps, isBlockList })

        // Navigate to breathing exercise for non-workflow sessions
        navigate('/breathing-exercise', { state: sessionState })
      }
    } catch (error) {
      console.error('Failed to start flow session:', error)
    }
  }

  const dismissHint = () => {
    localStorage.setItem('workflowHintShown', 'true')
    setShowHint(false)
  }

  // Update the handlers to use the new state management
  const handleDurationChange = (value: number | null) => {
    setDuration(value ? Duration.fromObject({ minutes: value }) : null)
  }

  const handlePlaylistSelect = (playlist: { id: string, service: 'spotify' | 'apple' | null }) => {
    setSelectedPlaylist(playlist.id)
  }

  const handleAppSelect = (app: SearchOption) => {
    setSelectedApps([...selectedApps, app])
  }

  const handleAppRemove = (app: SearchOption) => {
    setSelectedApps(selectedApps.filter(a => 
      a.type === 'app' && app.type === 'app' 
        ? a.app.app_external_id !== app.app.app_external_id
        : a !== app
    ))
  }

  const handleIsAllowListChange = (value: boolean) => {
    setIsAllowList(value)
  }

  return (
    <div className="flex flex-col h-screen">
      <div className="flex">
        <div className="h-14 border-b flex items-center px-2">
          <Logo />
        </div>
        <TopNav variant="modal" />
      </div>
      <div className="flex-1 flex items-center justify-center bg-background/80 backdrop-blur-sm">
        <Card className="w-[450px]">
          <CardContent className="pt-6 space-y-6">
            {showHint && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="text-xs text-muted-foreground text-center mb-2 relative"
              >
                <div className="bg-muted/50 rounded-lg py-1.5 px-3 pr-8">
                  Use <kbd className="px-1.5 py-0.5 bg-muted rounded-md">←</kbd> and <kbd className="px-1.5 py-0.5 bg-muted rounded-md">→</kbd> to switch workflows
                  <button
                    onClick={dismissHint}
                    className="absolute right-2 top-1/2 -translate-y-1/2 hover:text-foreground"
                    aria-label="Dismiss hint"
                  >
                    ×
                  </button>
                </div>
              </motion.div>
            )}

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
              />
            </motion.div>

            <div>
              <AppSelector
                selectedApps={selectedApps}
                onAppSelect={handleAppSelect}
                onAppRemove={handleAppRemove}
                isAllowList={isAllowList}
                onIsAllowListChange={handleIsAllowListChange}
              />
            </div>

            {/* Show music selector by default unless explicitly disabled by workflow */}
            {(!selectedWorkflow || selectedWorkflow.settings.hasMusic !== false) && (
              <div>
                <MusicSelector
                  selectedPlaylist={selectedPlaylist}
                  onPlaylistSelect={handlePlaylistSelect}
                  onConnectClick={() => {
                    navigate('/settings#music-integrations')
                  }}
                />
              </div>
            )}

            <div>
              <TimeSelector
                value={duration?.as('minutes') ?? null}
                onChange={handleDurationChange}
              />
            </div>

            <Button
              className="w-full"
              onClick={handleBegin}
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

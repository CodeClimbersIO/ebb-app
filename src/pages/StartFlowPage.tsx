import { useState, useEffect } from 'react'
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
import { MusicSelector } from '@/components/MusicSelector'
import { AppSelector, type SearchOption } from '@/components/AppSelector'

export const StartFlowPage = () => {
  const [duration, setDuration] = useState<number | null>(null)
  const [selectedWorkflowId, setSelectedWorkflowId] = useState<string | null>(null)
  const [selectedWorkflow, setSelectedWorkflow] = useState<Workflow | null>(null)
  const [showHint, setShowHint] = useState(false)
  const [selectedPlaylist, setSelectedPlaylist] = useState<string | null>(null)
  const [selectedApps, setSelectedApps] = useState<SearchOption[]>([])
  const [isAllowList, setIsAllowList] = useState(false)
  const [hasModifiedSettings, setHasModifiedSettings] = useState(false)
  const navigate = useNavigate()

  // Compare current settings with workflow defaults
  useEffect(() => {
    if (!selectedWorkflow) {
      setHasModifiedSettings(false)
      return
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
    
    setHasModifiedSettings(initialState !== currentState)
  }, [selectedWorkflow, duration, selectedPlaylist, selectedApps, isAllowList])

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
        setSelectedWorkflow(newWorkflow)
        // Set duration from workflow's default duration
        setDuration(newWorkflow.settings.defaultDuration)
        // Set music preferences
        setSelectedPlaylist(newWorkflow.selectedPlaylist || null)
        // Set blocking preferences
        setSelectedApps(newWorkflow.selectedApps || [])
        // Set allow list preference
        setIsAllowList(newWorkflow.settings.isAllowList || false)
      }
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
            // Set initial selection to the workflow's default duration
            setDuration(initialWorkflow.settings.defaultDuration)
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
  }, [])

  // Update workflow selection in WorkflowSelector
  const handleWorkflowSelect = async (workflowId: string) => {
    try {
      setSelectedWorkflowId(workflowId)
      
      // Get the full workflow data
      const workflow = await WorkflowApi.getWorkflowById(workflowId)
      if (workflow) {
        setSelectedWorkflow(workflow)
        // Set duration from workflow's default duration
        setDuration(workflow.settings.defaultDuration)
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
        switchWorkflow('right')
      } else if (event.key === 'ArrowRight') {
        switchWorkflow('left')
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selectedWorkflowId, duration])

  const handleBegin = async () => {
    try {
      // Get all blocked apps - use current selections regardless of workflow
      const blockingApps = selectedApps.map((app: SearchOption) => {
        if (app.type === 'app') {
          return {
            external_id: app.app.app_external_id,
            is_browser: app.app.is_browser === 1
          }
        }
        if (app.type === 'custom') {
          return {
            external_id: app.url,
            is_browser: true
          }
        }
        return null
      }).filter(Boolean)

      // Start blocking with the current isAllowList preference
      await invoke('start_blocking', { 
        blockingApps, 
        isBlockList: !isAllowList
      })

      // If workflow is selected, update its lastSelected timestamp
      if (selectedWorkflowId) {
        await WorkflowApi.updateLastSelected(selectedWorkflowId)
      }

      const sessionId = await FlowSessionApi.startFlowSession(
        selectedWorkflow?.name || 'Focus Session',
        duration || undefined
      )

      if (!sessionId) {
        throw new Error('No session ID returned from API')
      }

      const sessionState = {
        startTime: Date.now(),
        objective: selectedWorkflow?.name || 'Focus Session',
        sessionId,
        duration: duration || undefined,
        workflowId: selectedWorkflowId || null,
        hasBreathing: selectedWorkflow?.settings.hasBreathing || false,
        hasTypewriter: selectedWorkflow?.settings.hasTypewriter || false,
        hasMusic: selectedWorkflow?.settings.hasMusic || false,
        selectedPlaylist: selectedPlaylist || selectedWorkflow?.selectedPlaylist || null,
        selectedPlaylistName: selectedWorkflow?.selectedPlaylistName || null
      }

      // Skip breathing exercise if no workflow selected or if disabled in settings
      if (!selectedWorkflow?.settings.hasBreathing) {
        navigate('/session', { state: sessionState })
      } else {
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
                hasModifiedSettings={hasModifiedSettings}
              />
            </motion.div>

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
              />
            </div>

            {/* Show music selector by default unless explicitly disabled by workflow */}
            {(!selectedWorkflow || selectedWorkflow.settings.hasMusic !== false) && (
              <div>
                <MusicSelector
                  selectedPlaylist={selectedPlaylist}
                  onPlaylistSelect={(playlist) => {
                    setSelectedPlaylist(playlist.id)
                  }}
                  onConnectClick={() => {
                    navigate('/settings#music-integrations')
                  }}
                />
              </div>
            )}

            <div>
              <TimeSelector
                value={duration}
                onChange={(value) => {
                  setDuration(value)
                }}
              />
            </div>

            <Button
              className="w-full"
              onClick={handleBegin}
              disabled={false}
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

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { TopNav } from '@/components/TopNav'
import { Logo } from '@/components/ui/logo'
import { FlowSessionApi } from '../api/ebbApi/flowSessionApi'
import { TimeSelector } from '@/components/TimeSelector'
import { WorkflowSelector } from '@/components/WorkflowSelector'

// Load workflows from local storage
const loadWorkflows = () => {
  const saved = localStorage.getItem('workflows')
  return saved ? JSON.parse(saved) : {}
}

export const StartFlowPage = () => {
  const [duration, setDuration] = useState<number | null>(() => {
    const saved = localStorage.getItem('lastDuration')
    return saved ? JSON.parse(saved) : null
  })
  const [selectedWorkflowId, setSelectedWorkflowId] = useState<string | null>(null)
  const navigate = useNavigate()

  // Handle keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === 'Enter' && selectedWorkflowId) {
        handleBegin()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selectedWorkflowId])

  // Set initial workflow from local storage
  useEffect(() => {
    const workflows = loadWorkflows()
    const workflowIds = Object.keys(workflows)
    if (workflowIds.length > 0) {
      setSelectedWorkflowId(workflowIds[0])
    }
  }, [])

  const handleBegin = async () => {
    if (!selectedWorkflowId) return

    const workflows = loadWorkflows()
    const workflow = workflows[selectedWorkflowId]
    if (!workflow) return

    // Save duration for next time
    if (duration) {
      localStorage.setItem('lastDuration', JSON.stringify(duration))
    }

    const sessionId = await FlowSessionApi.startFlowSession(
      workflow.name,
      duration || undefined,
      workflow.blockedApps || [],
    )

    if (!sessionId) {
      throw new Error('No session ID returned from API')
    }

    const sessionState = {
      startTime: Date.now(),
      objective: workflow.name,
      sessionId,
      duration: duration || undefined,
      workflowId: selectedWorkflowId,
      hasBreathing: workflow.settings?.hasBreathing,
      hasTypewriter: workflow.settings?.hasTypewriter,
      hasMusic: workflow.settings?.hasMusic,
      selectedPlaylist: workflow.selectedPlaylist,
    }

    // Skip breathing exercise if disabled in settings
    if (!workflow.settings?.hasBreathing) {
      navigate('/session', { state: sessionState })
    } else {
      navigate('/breathing-exercise', { state: sessionState })
    }
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
        <Card className="w-[400px]">
          <CardContent className="pt-6 space-y-6">
            <WorkflowSelector 
              selectedId={selectedWorkflowId} 
              onSelect={setSelectedWorkflowId} 
            />

            <div>
              <TimeSelector
                value={duration}
                onChange={setDuration}
              />
            </div>

            <Button
              className="w-full"
              onClick={handleBegin}
              disabled={!selectedWorkflowId}
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

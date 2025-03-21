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

// Load workflows from local storage
const loadWorkflows = () => {
  const saved = localStorage.getItem('workflows')
  return saved ? JSON.parse(saved) : {}
}

export const StartFlowPage = () => {
  const [duration, setDuration] = useState<number | null>(null)
  const [selectedWorkflowId, setSelectedWorkflowId] = useState<string | null>(null)
  const [slideDirection, setSlideDirection] = useState<'left' | 'right'>('left')
  const [showHint, setShowHint] = useState(() => {
    return localStorage.getItem('workflowHintShown') !== 'true'
  })
  const navigate = useNavigate()

  // Handle workflow switching
  const switchWorkflow = (direction: 'left' | 'right') => {
    const workflows = loadWorkflows()
    const workflowIds = Object.keys(workflows)
    if (workflowIds.length <= 1) return

    const currentIndex = workflowIds.indexOf(selectedWorkflowId || workflowIds[0])
    let newIndex

    if (direction === 'left') {
      newIndex = currentIndex <= 0 ? workflowIds.length - 1 : currentIndex - 1
    } else {
      newIndex = currentIndex >= workflowIds.length - 1 ? 0 : currentIndex + 1
    }

    const newWorkflowId = workflowIds[newIndex]
    setSlideDirection(direction)
    setSelectedWorkflowId(newWorkflowId)
    
    // Just set the initial selection to the workflow's default duration
    const workflow = workflows[newWorkflowId]
    setDuration(workflow?.settings?.defaultDuration || null)
  }

  // Set initial workflow from local storage
  useEffect(() => {
    const workflows = loadWorkflows()
    const workflowIds = Object.keys(workflows)
    if (workflowIds.length > 0) {
      const initialWorkflowId = workflowIds[0]
      setSelectedWorkflowId(initialWorkflowId)
      
      // Set initial selection to the workflow's default duration
      const workflow = workflows[initialWorkflowId]
      setDuration(workflow?.settings?.defaultDuration || null)
    }
  }, [])

  // Update workflow selection in WorkflowSelector
  const handleWorkflowSelect = (workflowId: string) => {
    setSelectedWorkflowId(workflowId)
    
    // Set initial selection to the workflow's default duration
    const workflows = loadWorkflows()
    const workflow = workflows[workflowId]
    setDuration(workflow?.settings?.defaultDuration || null)
  }

  // Add keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === 'Enter' && selectedWorkflowId) {
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
    if (!selectedWorkflowId) return

    const workflows = loadWorkflows()
    const workflow = workflows[selectedWorkflowId]
    if (!workflow) return

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
        <Card className="w-[400px]">
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
              key={selectedWorkflowId}
              initial={{ 
                x: slideDirection === 'right' ? -50 : 50,
                opacity: 0 
              }}
              animate={{ 
                x: 0,
                opacity: 1 
              }}
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

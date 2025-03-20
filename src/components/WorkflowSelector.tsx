import { Music, ScanEye, ShieldCheck, ShieldX, X, Settings } from 'lucide-react'
import { Card } from './ui/card'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from './ui/tooltip'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from './ui/dialog'
import { useState, useEffect } from 'react'
import { WorkflowEdit } from './WorkflowEdit'
import { SearchOption } from './AppSelector'

interface WorkflowSelectorProps {
  selectedId: string | null
  onSelect: (workflowId: string) => void
}

interface Workflow {
  id: string
  name: string
  hasMusic: boolean
  hasTypewriter: boolean
  blockedApps: string[]
  selectedApps?: SearchOption[]
  selectedPlaylist?: string | null
  selectedPlaylistName?: string | null
  lastSelected?: number
  settings?: {
    hasTypewriter: boolean
    hasBreathing: boolean
    hasMusic: boolean
    isAllowList?: boolean
  }
}

// Load workflows from local storage
const loadWorkflows = (): Record<string, Workflow> => {
  const saved = localStorage.getItem('workflows')
  return saved ? JSON.parse(saved) : {}
}

function WorkflowCard({ 
  workflow, 
  isSelected, 
  onClick,
  onSettingsClick,
  showSettings = false,
  variant = 'horizontal'
}: { 
  workflow: Workflow
  isSelected: boolean
  onClick: () => void
  onSettingsClick?: () => void
  showSettings?: boolean
  variant?: 'horizontal' | 'vertical'
}) {
  const [isHovered, setIsHovered] = useState(false)

  const formatAppsList = (apps: SearchOption[]) => {
    if (!apps || apps.length === 0) return 'No apps selected'
    
    const formattedNames = apps.map(app => {
      if (app.type === 'app') {
        return app.app.is_browser ? app.app.app_external_id : app.app.name
      } else if (app.type === 'custom') {
        return app.url
      } else {
        // Capitalize each word in categories
        return app.category.split('/').map(word => 
          word.split(' ').map(part => 
            part.charAt(0).toUpperCase() + part.slice(1)
          ).join(' ')
        ).join('/')
      }
    })

    if (formattedNames.length === 1) return formattedNames[0]
    return formattedNames.join(', ')
  }

  return (
    <Card
      className={`p-4 cursor-pointer hover:bg-accent transition-colors relative ${isSelected ? 'border-primary' : ''}`}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {showSettings && isHovered && (
        <button
          onClick={(e) => {
            e.stopPropagation()
            onSettingsClick?.()
          }}
          className="absolute right-2 top-2 p-1.5 rounded-md hover:bg-accent-foreground/10"
        >
          <Settings className="h-4 w-4 text-muted-foreground" />
        </button>
      )}
      <div className={`flex ${variant === 'horizontal' ? 'flex-row items-center justify-between' : 'flex-col items-start gap-4'}`}>
        <span className="font-medium">{workflow.name}</span>
        <div className="flex items-center gap-3">
          {workflow.settings?.hasMusic && workflow.selectedPlaylist && (
            <TooltipProvider delayDuration={300}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Music className="h-4 w-4 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Playing "{workflow.selectedPlaylistName || 'Selected Playlist'}" with Spotify</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
          
          {workflow.settings?.hasTypewriter && (
            <TooltipProvider delayDuration={300}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <ScanEye className="h-4 w-4 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Typewriter mode enabled</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
          
          {workflow.selectedApps && workflow.selectedApps.length > 0 && (
            <TooltipProvider delayDuration={300}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-1">
                    {workflow.settings?.isAllowList ? (
                      <ShieldCheck className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <ShieldX className="h-4 w-4 text-muted-foreground" />
                    )}
                    <span className="text-xs text-muted-foreground">
                      {workflow.selectedApps.length > 3 
                        ? `+${workflow.selectedApps.length}` 
                        : workflow.selectedApps.length}
                    </span>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>
                    {workflow.settings?.isAllowList 
                      ? `Only allowing ${formatAppsList(workflow.selectedApps)}` 
                      : `Blocking ${formatAppsList(workflow.selectedApps)}`}
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      </div>
    </Card>
  )
}

export function WorkflowSelector({ selectedId, onSelect }: WorkflowSelectorProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [editingWorkflow, setEditingWorkflow] = useState<Workflow | null>(null)
  const [workflows, setWorkflows] = useState<Record<string, Workflow>>({})

  // Load workflows from local storage
  useEffect(() => {
    const savedWorkflows = loadWorkflows()
    setWorkflows(savedWorkflows)
  }, [])

  const selectedWorkflow = workflows[selectedId || '']

  const handleSelect = (workflowId: string) => {
    if (workflowId === 'new') {
      if (Object.keys(workflows).length >= 6) {
        // TODO: Show toast or alert that max workflows reached
        return
      }
      const newWorkflow: Workflow = {
        id: crypto.randomUUID(),
        name: 'New Workflow',
        hasMusic: false,
        hasTypewriter: false,
        blockedApps: [],
        lastSelected: Date.now()
      }
      setEditingWorkflow(newWorkflow)
      setIsCreateDialogOpen(true)
    } else {
      // Update lastSelected timestamp
      const updatedWorkflows = {
        ...workflows,
        [workflowId]: {
          ...workflows[workflowId],
          lastSelected: Date.now()
        }
      }
      localStorage.setItem('workflows', JSON.stringify(updatedWorkflows))
      setWorkflows(updatedWorkflows)
      onSelect(workflowId)
      setIsDialogOpen(false)
    }
  }

  const handleSettingsClick = (workflow: Workflow) => {
    setEditingWorkflow(workflow)
    setIsEditDialogOpen(true)
  }

  const handleSaveWorkflow = () => {
    setIsEditDialogOpen(false)
    setIsCreateDialogOpen(false)
    // Refresh workflows from storage
    const updatedWorkflows = loadWorkflows()
    setWorkflows(updatedWorkflows)
    // If this was a new workflow, select it
    if (editingWorkflow && isCreateDialogOpen) {
      onSelect(editingWorkflow.id)
    }
  }

  const handleDeleteWorkflow = () => {
    setIsEditDialogOpen(false)
    setIsCreateDialogOpen(false)
    // Refresh workflows from storage
    const updatedWorkflows = loadWorkflows()
    setWorkflows(updatedWorkflows)
    // If the deleted workflow was selected, select the first available one
    if (selectedId && !updatedWorkflows[selectedId]) {
      const firstWorkflowId = Object.keys(updatedWorkflows)[0]
      if (firstWorkflowId) {
        onSelect(firstWorkflowId)
      }
    }
  }

  if (!selectedWorkflow && Object.keys(workflows).length > 0) {
    // Auto-select first workflow if none selected
    onSelect(Object.keys(workflows)[0])
    return null
  }

  return (
    <>
      <div onClick={() => setIsDialogOpen(true)} className="cursor-pointer">
        {selectedWorkflow ? (
          <WorkflowCard
            workflow={selectedWorkflow}
            isSelected={false}
            onClick={() => setIsDialogOpen(true)}
            variant="horizontal"
          />
        ) : (
          <Card className="p-4 cursor-pointer hover:bg-accent transition-colors border-dashed">
            <div className="flex items-center justify-center h-full">
              <span className="text-primary">Create Workflow +</span>
            </div>
          </Card>
        )}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="text-xl font-normal">Select Workflow</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 mt-4">
            {Object.values(workflows)
              .sort((a, b) => (b.lastSelected || 0) - (a.lastSelected || 0))
              .map((workflow) => (
              <WorkflowCard
                key={workflow.id}
                workflow={workflow}
                isSelected={workflow.id === selectedId}
                onClick={() => handleSelect(workflow.id)}
                onSettingsClick={() => handleSettingsClick(workflow)}
                showSettings
                variant="vertical"
              />
            ))}
            {Object.keys(workflows).length < 6 && (
              <Card
                className="p-4 cursor-pointer hover:bg-accent transition-colors border-dashed"
                onClick={() => handleSelect('new')}
              >
                <div className="flex items-center justify-center h-full">
                  <span className="text-primary">Add Workflow +</span>
                </div>
              </Card>
            )}
          </div>
          <button 
            onClick={() => setIsDialogOpen(false)}
            className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground"
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </button>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          {editingWorkflow && (
            <WorkflowEdit
              workflow={editingWorkflow}
              onSave={handleSaveWorkflow}
              onDelete={handleDeleteWorkflow}
            />
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          {editingWorkflow && (
            <WorkflowEdit
              workflow={editingWorkflow}
              onSave={handleSaveWorkflow}
              onDelete={handleDeleteWorkflow}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  )
} 

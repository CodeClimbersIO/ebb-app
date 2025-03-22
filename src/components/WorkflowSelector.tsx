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
import { Workflow, WorkflowApi } from '../api/ebbApi/workflowApi'

interface WorkflowSelectorProps {
  selectedId: string | null
  onSelect: (workflowId: string) => void
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
          {workflow.settings.hasMusic && workflow.selectedPlaylist && (
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
          
          {workflow.settings.hasTypewriter && (
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
                        ? `${workflow.selectedApps.length}` 
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
  const [workflows, setWorkflows] = useState<Workflow[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Load workflows from database
  useEffect(() => {
    const loadWorkflows = async () => {
      try {
        setIsLoading(true)
        const workflows = await WorkflowApi.getWorkflows()
        setWorkflows(workflows)
        setIsLoading(false)
      } catch (error) {
        console.error('Failed to load workflows:', error)
        setIsLoading(false)
      }
    }
    
    loadWorkflows()
  }, [])

  const selectedWorkflow = workflows.find(w => w.id === selectedId)

  const handleSelect = async (workflowId: string) => {
    if (workflowId === 'new') {
      if (workflows.length >= 6) {
        // TODO: Show toast or alert that max workflows reached
        return
      }
      const newWorkflow: Workflow = {
        name: 'New Workflow',
        selectedApps: [],
        lastSelected: Date.now(),
        settings: {
          hasTypewriter: false,
          hasBreathing: true,
          hasMusic: false,
          isAllowList: false,
          defaultDuration: null
        }
      }
      setEditingWorkflow(newWorkflow)
      setIsCreateDialogOpen(true)
    } else {
      try {
        // Update lastSelected timestamp in the database
        await WorkflowApi.updateLastSelected(workflowId)
        
        // Optimistically update the UI
        const updatedWorkflows = workflows.map(workflow => {
          if (workflow.id === workflowId) {
            return { 
              ...workflow, 
              lastSelected: Date.now() 
            }
          }
          return workflow
        })
        
        setWorkflows(updatedWorkflows)
        onSelect(workflowId)
        setIsDialogOpen(false)
      } catch (error) {
        console.error('Failed to update workflow:', error)
      }
    }
  }

  const handleSettingsClick = (workflow: Workflow) => {
    setEditingWorkflow(workflow)
    setIsEditDialogOpen(true)
  }

  const handleSaveWorkflow = async (savedWorkflow: Workflow) => {
    // Refresh workflows from database
    const updatedWorkflows = await WorkflowApi.getWorkflows()
    setWorkflows(updatedWorkflows)
    
    // Select the saved workflow
    onSelect(savedWorkflow.id!)
    
    setIsEditDialogOpen(false)
    setIsCreateDialogOpen(false)
  }

  const handleDeleteWorkflow = async () => {
    if (!editingWorkflow || !editingWorkflow.id) return
    
    try {
      await WorkflowApi.deleteWorkflow(editingWorkflow.id)
      
      // Refresh workflows from database
      const updatedWorkflows = await WorkflowApi.getWorkflows()
      setWorkflows(updatedWorkflows)
      
      // If the deleted workflow was selected, select the first available one
      if (selectedId === editingWorkflow.id && updatedWorkflows.length > 0 && updatedWorkflows[0].id) {
        onSelect(updatedWorkflows[0].id)
      }
    } catch (error) {
      console.error('Failed to delete workflow:', error)
    }
    
    setIsEditDialogOpen(false)
    setIsCreateDialogOpen(false)
  }

  if (isLoading) {
    return (
      <Card className="p-4 animate-pulse">
        <div className="h-6 bg-accent rounded w-24 mb-2"></div>
        <div className="h-4 bg-accent rounded w-full"></div>
      </Card>
    )
  }

  if (!selectedWorkflow && workflows.length > 0) {
    // Auto-select first workflow if none selected
    const firstWorkflow = workflows[0]
    if (firstWorkflow.id) {
      onSelect(firstWorkflow.id)
    }
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
            <div className="flex flex-col items-center justify-center gap-2 py-2">
              <span className="text-primary font-medium">Create Your First Workflow</span>
              <span className="text-sm text-muted-foreground">Set up your focus preferences</span>
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
            {workflows
              .sort((a, b) => (b.lastSelected || 0) - (a.lastSelected || 0))
              .map((workflow) => (
                workflow.id && (
                  <WorkflowCard
                    key={workflow.id}
                    workflow={workflow}
                    isSelected={workflow.id === selectedId}
                    onClick={() => handleSelect(workflow.id!)}
                    onSettingsClick={() => handleSettingsClick(workflow)}
                    showSettings
                    variant="vertical"
                  />
                )
            ))}
            {workflows.length < 6 && (
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

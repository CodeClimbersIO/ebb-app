import { Settings, Plus } from 'lucide-react'
import { motion } from 'motion/react'
import {
  Dialog,
  DialogContent,
} from './ui/dialog'
import {
  ContextMenu,
  ContextMenuTrigger,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
} from './ui/context-menu'
import { useState, useEffect, useRef } from 'react'
import { WorkflowEdit } from './WorkflowEdit'
import { Workflow, WorkflowApi } from '../api/ebbApi/workflowApi'
import { Badge } from './ui/badge'
import { cn } from '@/lib/utils/tailwind.util'

interface WorkflowSelectorProps {
  selectedId: string | null
  onSelect: (workflowId: string) => void
  hasModifiedSettings?: boolean
}

function WorkflowBadge({ 
  workflow, 
  isSelected,
  hasModifiedSettings,
  onClick,
  onSettingsClick,
  onCreateClick,
  className,
  ...props
}: { 
  workflow: Workflow
  isSelected: boolean
  hasModifiedSettings?: boolean
  onClick: () => void
  onSettingsClick?: () => void
  onDeleteClick?: () => void
  onCreateClick?: () => void
  className?: string
  'data-workflow-id'?: string
}) {
  return (
    <motion.div layout>
      <ContextMenu modal={false}>
        <ContextMenuTrigger>
          <Badge
            variant={isSelected && !hasModifiedSettings ? 'default' : 'secondary'}
            className={cn(
              'cursor-pointer whitespace-nowrap overflow-hidden text-ellipsis px-4',
              className
            )}
            onClick={onClick}
            {...props}
          >
            {workflow.name}
          </Badge>
        </ContextMenuTrigger>
        <ContextMenuContent>
        <ContextMenuItem onClick={onSettingsClick} className="cursor-pointer">
            <Settings className="mr-2 h-4 w-4" />
            <span>Configure</span>
          </ContextMenuItem>
          <ContextMenuSeparator />
          <ContextMenuItem onClick={onCreateClick} className="cursor-pointer">
            <Plus className="mr-2 h-4 w-4" />
            <span>New Preset</span>
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
    </motion.div>
  )
}

export function WorkflowSelector({ selectedId, onSelect, hasModifiedSettings }: WorkflowSelectorProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [editingWorkflow, setEditingWorkflow] = useState<Workflow | null>(null)
  const [workflows, setWorkflows] = useState<Workflow[]>([])
  const [showLeftMask, setShowLeftMask] = useState(false)

  // Handle scroll position to determine if left mask should be shown
  const handleScroll = () => {
    if (scrollContainerRef.current) {
      setShowLeftMask(scrollContainerRef.current.scrollLeft > 0)
    }
  }

  // Setup scroll event listener
  useEffect(() => {
    const container = scrollContainerRef.current
    if (container) {
      container.addEventListener('scroll', handleScroll)
      return () => container.removeEventListener('scroll', handleScroll)
    }
  }, [])

  // Auto-scroll selected workflow into view
  useEffect(() => {
    if (selectedId && scrollContainerRef.current) {
      const container = scrollContainerRef.current
      const selectedElement = container.querySelector(`[data-workflow-id="${selectedId}"]`) as HTMLElement
      
      if (selectedElement) {
        // Get the visible area of the container
        const containerRect = container.getBoundingClientRect()
        const elementRect = selectedElement.getBoundingClientRect()
        
        // Check if the element is not fully visible
        const isFullyVisible = 
          elementRect.left >= containerRect.left && 
          elementRect.right <= containerRect.right
        
        if (!isFullyVisible) {
          // Calculate distance from element center to container center
          const containerCenter = containerRect.left + containerRect.width / 2
          const elementCenter = elementRect.left + elementRect.width / 2
          const scrollDistance = elementCenter - containerCenter
          
          // Scroll the container
          container.scrollBy({
            left: scrollDistance,
            behavior: 'smooth'
          })
        }
      }
    }
  }, [selectedId])

  // Load workflows from database and sort by last selected
  useEffect(() => {
    const loadWorkflows = async () => {
      try {
        const loadedWorkflows = await WorkflowApi.getWorkflows()
        // Sort by lastSelected (newest first)
        const sortedWorkflows = [...loadedWorkflows].sort((a, b) => 
          (b.lastSelected || 0) - (a.lastSelected || 0)
        )
        setWorkflows(sortedWorkflows)
        
        // If no workflow is selected and we have workflows, select the most recent one
        if (!selectedId && sortedWorkflows.length > 0) {
          if (sortedWorkflows[0].id) {
            onSelect(sortedWorkflows[0].id)
          }
        }
      } catch (error) {
        console.error('Failed to load workflows:', error)
      }
    }
    
    loadWorkflows()
  }, [selectedId, onSelect])

  const handleSelect = async (workflowId: string) => {
    if (workflowId === 'new') {
      const newWorkflow: Workflow = {
        name: 'New Preset',
        selectedApps: [],
        lastSelected: Date.now(),
        settings: {
          hasTypewriter: false,
          hasBreathing: true,
          hasMusic: true,
          isAllowList: false,
          defaultDuration: null
        }
      }
      setEditingWorkflow(newWorkflow)
      setIsCreateDialogOpen(true)
    } else {
      onSelect(workflowId)
    }
  }

  const handleSettingsClick = (workflow: Workflow) => {
    // Close any existing dialogs first
    setIsCreateDialogOpen(false)
    
    // Set the workflow and open edit dialog
    setEditingWorkflow(workflow)
    setIsEditDialogOpen(true)
  }

  const handleDeleteClick = async (workflow: Workflow) => {
    if (!workflow.id) return
    
    try {
      await WorkflowApi.deleteWorkflow(workflow.id)
      
      // Refresh workflows from database
      const updatedWorkflows = await WorkflowApi.getWorkflows()
      setWorkflows(updatedWorkflows)
      
      // If the deleted workflow was selected, select the first available one
      if (selectedId === workflow.id && updatedWorkflows.length > 0 && updatedWorkflows[0].id) {
        onSelect(updatedWorkflows[0].id)
      }
    } catch (error) {
      console.error('Failed to delete workflow:', error)
    }
  }

  const handleSaveWorkflow = async (savedWorkflow: Workflow, shouldCloseDialog = true) => {
    // Refresh workflows from database
    const updatedWorkflows = await WorkflowApi.getWorkflows()
    setWorkflows(updatedWorkflows)
    
    // Always select the saved workflow
    if (savedWorkflow.id) {
      onSelect(savedWorkflow.id)
    }
    
    if (shouldCloseDialog) {
      setIsEditDialogOpen(false)
      setIsCreateDialogOpen(false)
    }
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

  return (
    <>
      <div className="relative w-full">
        <style dangerouslySetInnerHTML={{
          __html: `
            [data-scrollbar-hide]::-webkit-scrollbar {
              display: none;
            }
          `
        }} />
        <motion.div 
          ref={scrollContainerRef}
          className="flex gap-2 items-center overflow-x-auto scroll-smooth px-2"
          style={{
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
            WebkitOverflowScrolling: 'touch'
          }}
          data-scrollbar-hide
          layout
        >
          {workflows.length === 0 ? (
            <Badge 
              variant='secondary' 
              className='cursor-pointer border-dashed shrink-0'
              onClick={() => handleSelect('new')}
            >
              Create preset
            </Badge>
          ) : (
            <>
              {workflows.map((workflow) => (
                <WorkflowBadge
                  key={workflow.id}
                  workflow={workflow}
                  isSelected={workflow.id === selectedId}
                  hasModifiedSettings={hasModifiedSettings}
                  onClick={() => workflow.id && onSelect(workflow.id)}
                  onSettingsClick={() => handleSettingsClick(workflow)}
                  onDeleteClick={() => handleDeleteClick(workflow)}
                  onCreateClick={() => handleSelect('new')}
                  className="shrink-0"
                  data-workflow-id={workflow.id}
                />
              ))}
              
              {workflows.length < 6 && (
                <motion.div layout>
                  <Badge 
                    variant='secondary' 
                    className='cursor-pointer border-dashed opacity-50 px-4 shrink-0'
                    onClick={() => handleSelect('new')}
                  >
                    +
                  </Badge>
                </motion.div>
              )}
            </>
          )}
        </motion.div>
        
        {/* Left edge gradient mask - only show if not at start */}
        {showLeftMask && (
          <div className="absolute left-0 top-0 bottom-0 w-6 bg-gradient-to-r from-background to-transparent pointer-events-none z-10" />
        )}
        
        {/* Right edge gradient mask */}
        <div className="absolute right-0 top-0 bottom-0 w-6 bg-gradient-to-l from-background to-transparent pointer-events-none z-10" />
      </div>

      <Dialog open={isEditDialogOpen} onOpenChange={(open) => {
        if (!open && editingWorkflow?.id) {
          onSelect(editingWorkflow.id)
        }
        setIsEditDialogOpen(open)
      }}>
        <DialogContent className="sm:max-w-[600px]" onOpenAutoFocus={(e) => e.preventDefault()}>
          {editingWorkflow && (
            <WorkflowEdit
              workflow={editingWorkflow}
              onSave={handleSaveWorkflow}
              onDelete={handleDeleteWorkflow}
            />
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={isCreateDialogOpen} onOpenChange={(open) => {
        if (!open && editingWorkflow?.id) {
          onSelect(editingWorkflow.id)
        }
        setIsCreateDialogOpen(open)
      }}>
        <DialogContent className="sm:max-w-[600px]" onOpenAutoFocus={(e) => e.preventDefault()}>
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

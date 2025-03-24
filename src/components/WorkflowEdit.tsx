import { useState, useEffect, useCallback } from 'react'
import { Button } from './ui/button'
import { Tabs, TabsList, TabsTrigger, TabsContent } from './ui/tabs'
import { Switch } from './ui/switch'
import { DialogHeader, DialogTitle, Dialog, DialogContent, DialogDescription, DialogFooter } from './ui/dialog'
import { Input } from './ui/input'
import { AppSelector, type SearchOption } from './AppSelector'
import { MusicSelector } from './MusicSelector'
import { Trash2, Check } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Workflow, WorkflowApi } from '../api/ebbApi/workflowApi'
import { motion, AnimatePresence } from 'motion/react'

interface WorkflowEditProps {
  workflow: Workflow
  onSave: (savedWorkflow: Workflow, shouldCloseDialog?: boolean) => void
  onDelete?: () => void
}

export function WorkflowEdit({ workflow, onSave, onDelete }: WorkflowEditProps) {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('blocking')
  const [isEditing, setIsEditing] = useState(false)
  const [name, setName] = useState(workflow.name)
  const [selectedApps, setSelectedApps] = useState<SearchOption[]>(workflow.selectedApps || [])
  const [selectedPlaylist, setSelectedPlaylist] = useState<string | null>(workflow.selectedPlaylist || null)
  const [selectedPlaylistName, setSelectedPlaylistName] = useState<string | null>(workflow.selectedPlaylistName || null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showSavedIndicator, setShowSavedIndicator] = useState(false)
  const [currentWorkflowId, setCurrentWorkflowId] = useState<string | undefined>(workflow.id)
  const [settings, setSettings] = useState({
    hasTypewriter: workflow.settings.hasTypewriter,
    hasBreathing: workflow.settings.hasBreathing ?? true,
    hasMusic: workflow.settings.hasMusic,
    isAllowList: workflow.settings.isAllowList ?? false,
    defaultDuration: workflow.settings.defaultDuration,
  })

  const [hasChanges, setHasChanges] = useState(false)
  const [saveCompleted, setSaveCompleted] = useState(false)
  const [tempName, setTempName] = useState(workflow.name)
  
  useEffect(() => {
    const initialState = JSON.stringify({
      selectedApps: workflow.selectedApps,
      selectedPlaylist: workflow.selectedPlaylist,
      selectedPlaylistName: workflow.selectedPlaylistName,
      settings: workflow.settings
    })
    
    const currentState = JSON.stringify({
      selectedApps,
      selectedPlaylist,
      selectedPlaylistName,
      settings
    })
    
    const stateChanged = initialState !== currentState
    setHasChanges(stateChanged)
    
    if (stateChanged) {
      setSaveCompleted(false)
    }
  }, [selectedApps, selectedPlaylist, selectedPlaylistName, settings, workflow])

  const handleNameChange = (value: string) => {
    if (value.length <= 15) {
      setTempName(value)
    }
  }

  const handleNameSave = async () => {
    if (tempName.trim().length === 0) {
      setTempName(workflow.name)
      return
    }

    if (tempName !== workflow.name) {
      setName(tempName)
      await autoSaveWorkflow(true)
    }
    setIsEditing(false)
  }

  const autoSaveWorkflow = useCallback(async (includeNameChange = false) => {
    if ((!hasChanges && !includeNameChange) || (!includeNameChange && saveCompleted)) {
      return
    }
    
    const updatedWorkflow: Workflow = {
      id: currentWorkflowId,
      name: includeNameChange ? tempName : name,
      selectedApps,
      selectedPlaylist,
      selectedPlaylistName,
      settings: {
        ...settings
      }
    }
    
    try {
      const savedWorkflow = await WorkflowApi.saveWorkflow(updatedWorkflow)
      window.dispatchEvent(new CustomEvent('workflowSaved'))
      
      if (!currentWorkflowId && savedWorkflow.id) {
        setCurrentWorkflowId(savedWorkflow.id)
      }
      
      onSave(savedWorkflow, false)
      setSaveCompleted(true)
      
      setShowSavedIndicator(true)
      setTimeout(() => {
        setShowSavedIndicator(false)
      }, 2000)
    } catch (error) {
      console.error('Failed to save workflow:', error)
    }
  }, [name, tempName, selectedApps, selectedPlaylist, selectedPlaylistName, settings, currentWorkflowId, onSave, hasChanges, saveCompleted])

  useEffect(() => {
    if (hasChanges && !saveCompleted) {
      const timeoutId = setTimeout(() => {
        autoSaveWorkflow(false)
      }, 150)
      
      return () => clearTimeout(timeoutId)
    }
  }, [selectedApps, selectedPlaylist, selectedPlaylistName, settings, autoSaveWorkflow, hasChanges, saveCompleted])

  const handleDelete = async () => {
    if (!workflow.id) return
    
    try {
      await WorkflowApi.deleteWorkflow(workflow.id)
      setShowDeleteDialog(false)
      onDelete?.()
    } catch (error) {
      console.error('Failed to delete workflow:', error)
    }
  }

  return (
    <>
      <div className="flex flex-col h-[400px]">
        <DialogHeader className="mb-6">
          {isEditing ? (
            <div className="flex items-center gap-2">
              <Input
                value={tempName}
                onChange={(e) => handleNameChange(e.target.value)}
                onBlur={handleNameSave}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleNameSave()
                  }
                }}
                autoFocus
                maxLength={15}
                className="text-xl font-normal h-8 -mt-1 w-[200px]"
              />
              <span className="text-xs text-muted-foreground">
                {tempName.length}/15
              </span>
            </div>
          ) : (
            <DialogTitle 
              className="text-xl font-normal cursor-pointer hover:text-muted-foreground"
              onClick={() => setIsEditing(true)}
            >
              {name}
            </DialogTitle>
          )}
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1">
          <TabsList className="w-full grid grid-cols-3 mb-6">
            <TabsTrigger value="blocking" className="text-muted-foreground">Blocking</TabsTrigger>
            <TabsTrigger value="music" className="text-muted-foreground">Music</TabsTrigger>
            <TabsTrigger value="advanced" className="text-muted-foreground">Advanced</TabsTrigger>
          </TabsList>

          <div>
            <TabsContent value="blocking" className="space-y-4">
              <AppSelector
                selectedApps={selectedApps}
                onAppSelect={(app) => setSelectedApps([...selectedApps, app])}
                onAppRemove={(app) => setSelectedApps(selectedApps.filter(a => 
                  a.type === 'app' && app.type === 'app' 
                    ? a.app.app_external_id !== app.app.app_external_id
                    : a !== app
                ))}
              />

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-base font-medium">Allow List</span>
                  </div>
                  <div className="text-xs text-muted-foreground">Only allow selected apps and websites</div>
                </div>
                <Switch 
                  checked={settings.isAllowList}
                  onCheckedChange={(checked) => setSettings({ ...settings, isAllowList: checked })}
                />
              </div>
            </TabsContent>

            <TabsContent value="music" className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="text-base font-medium">Enable Music</div>
                    <div className="text-xs text-muted-foreground">Play music from Spotify during your session</div>
                  </div>
                  <Switch 
                    checked={settings.hasMusic}
                    onCheckedChange={(checked) => setSettings({ ...settings, hasMusic: checked })}
                  />
                </div>
                
                {settings.hasMusic && (
                  <MusicSelector
                    selectedPlaylist={selectedPlaylist}
                    onPlaylistSelect={(playlist) => {
                      setSelectedPlaylist(playlist.id)
                      const playlistData = localStorage.getItem('playlistData')
                      if (playlistData) {
                        const { playlists } = JSON.parse(playlistData)
                        const selectedPlaylist = playlists.find((p: { id: string, name: string }) => p.id === playlist.id)
                        if (selectedPlaylist) {
                          setSelectedPlaylistName(selectedPlaylist.name)
                        }
                      }
                      setSettings({ ...settings, hasMusic: true })
                    }}
                    onConnectClick={() => {
                      navigate('/settings#music-integrations')
                    }}
                  />
                )}
              </div>
            </TabsContent>

            <TabsContent value="advanced" className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="text-base font-medium">Default Duration</div>
                    <div className="text-xs text-muted-foreground">
                      Set a default duration for this workflow (in minutes)
                    </div>
                  </div>
                  <Input
                    type="number"
                    min="1"
                    max="999"
                    maxLength={3}
                    placeholder="###"
                    value={settings.defaultDuration || ''}
                    onChange={(e) => {
                      const value = e.target.value ? Math.min(parseInt(e.target.value), 999) : null
                      setSettings({ ...settings, defaultDuration: value })
                    }}
                    className="w-22"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-base font-medium">Typewriter Mode</span>
                      <span className="text-xs bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">Coming Soon</span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Turn everything except the active window black and white
                    </div>
                  </div>
                  <Switch 
                    checked={settings.hasTypewriter}
                    onCheckedChange={(checked) => setSettings({ ...settings, hasTypewriter: checked })}
                    disabled={true}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="text-base font-medium">Breathing Exercise</div>
                    <div className="text-xs text-muted-foreground">
                      Start each session with a 10 sec breathing exercise
                    </div>
                  </div>
                  <Switch 
                    checked={settings.hasBreathing}
                    onCheckedChange={(checked) => setSettings({ ...settings, hasBreathing: checked })}
                  />
                </div>
              </div>
            </TabsContent>
          </div>
        </Tabs>

        <div className="flex justify-between items-center pt-4 border-t mt-4">
          <Button 
            onClick={() => setShowDeleteDialog(true)} 
            variant="ghost" 
            size="sm"
            className="text-destructive hover:text-destructive hover:bg-destructive/10"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
          
          <div className="h-6 flex items-center">
            <AnimatePresence>
              {showSavedIndicator && (
                <motion.div 
                  className="flex items-center gap-2 text-muted-foreground text-sm"
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  transition={{ 
                    type: 'spring',
                    stiffness: 300, 
                    damping: 25
                  }}
                >
                  <Check className="h-4 w-4 text-green-500" />
                  <span>Saved</span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Workflow</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{name}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
} 

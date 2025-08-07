import { useState } from 'react'
import { Layout } from '@/components/Layout'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { useFocusSchedulesWithWorkflow, useDeleteFocusSchedule } from '@/api/hooks/useFocusSchedule'
import { FocusScheduleApi } from '@/api/ebbApi/focusScheduleApi'
import { ScheduleSessionModal } from '@/components/ScheduleSessionModal'
import { Calendar, Clock, Trash2 } from 'lucide-react'
import { error as errorLog } from '@tauri-apps/plugin-log'

export default function FocusSchedulePage() {
  const [showScheduleModal, setShowScheduleModal] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [editingScheduleId, setEditingScheduleId] = useState<string | undefined>()
  const [deletingScheduleId, setDeletingScheduleId] = useState<string | undefined>()
  
  const { data: schedules, isLoading } = useFocusSchedulesWithWorkflow()
  const { mutateAsync: deleteFocusSchedule } = useDeleteFocusSchedule()

  const handleEditSchedule = (scheduleId: string) => {
    setEditingScheduleId(scheduleId)
    setShowScheduleModal(true)
  }

  const handleCreateNew = () => {
    setEditingScheduleId(undefined)
    setShowScheduleModal(true)
  }

  const handleCloseModal = () => {
    setShowScheduleModal(false)
    setEditingScheduleId(undefined)
  }

  const handleDeleteSchedule = (scheduleId: string) => {
    setDeletingScheduleId(scheduleId)
    setShowDeleteDialog(true)
  }

  const confirmDelete = async () => {
    if (!deletingScheduleId) return
    
    try {
      await deleteFocusSchedule(deletingScheduleId)
      setShowDeleteDialog(false)
      setDeletingScheduleId(undefined)
    } catch (error) {
      errorLog(`Failed to delete focus schedule: ${error}`)
    }
  }

  if (isLoading) {
    return (
      <Layout>
        <div className="p-8">
          <div className="max-w-5xl mx-auto">
            <div className="flex items-center justify-center py-12">
              <div className="text-muted-foreground">Loading your focus schedule...</div>
            </div>
          </div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="p-8">
        <div className="max-w-5xl mx-auto">
          { schedules && schedules.length > 0 && (
            <div className="mb-8 flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-semibold mb-2">Focus Schedules</h1>
                <p className="text-muted-foreground">
                Schedule focus sessions to protect your most productive times
                </p>
              </div>
              <Button onClick={handleCreateNew}>
                <Calendar className="w-4 h-4 mr-2" />
              Create Schedule
              </Button>
            </div>
          )}
          <div className="space-y-4">
            {schedules && schedules.length > 0 ? (
              schedules.map((schedule) => (
                <Card key={schedule.id}>
                  <CardHeader className="pb-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg mb-2">
                          {schedule.label || 'Untitled Schedule'}
                        </CardTitle>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {FocusScheduleApi.formatScheduleDisplay(schedule)}
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {schedule.workflow_name || 'Unknown Workflow'}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleEditSchedule(schedule.id)}
                        >
                          Edit
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleDeleteSchedule(schedule.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              ))
            ) : (
              <div className="text-center py-12">
                <Calendar className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No focus schedules yet</h3>
                <p className="text-muted-foreground mb-6">
                  Create your first focus schedule to start protecting your productive time.
                </p>
                <Button onClick={handleCreateNew}>
                  <Calendar className="w-4 h-4 mr-2" />
                  Create Your First Schedule
                </Button>
              </div>
            )}
          </div>

          <Dialog open={showScheduleModal} onOpenChange={handleCloseModal}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>
                  {editingScheduleId ? 'Edit Focus Schedule' : 'Schedule Focus Session'}
                </DialogTitle>
                <DialogDescription>
                  Set up automatic focus sessions for specific days and times.
                </DialogDescription>
              </DialogHeader>
              <ScheduleSessionModal 
                scheduleId={editingScheduleId}
                onClose={handleCloseModal}
              />
            </DialogContent>
          </Dialog>

          <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Delete Focus Schedule?</DialogTitle>
                <DialogDescription>
                  This will permanently remove this scheduled focus session. This action cannot be undone.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>Cancel</Button>
                <Button variant="destructive" onClick={confirmDelete}>Delete</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </Layout>
  )
}

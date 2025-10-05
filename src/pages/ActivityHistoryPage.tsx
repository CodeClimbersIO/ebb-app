import { useState } from 'react'
import { Layout } from '@/components/Layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AnalyticsButton as Button } from '@/components/ui/analytics-button'
import { Input } from '@/components/ui/input'
import {
  useGetRecentlyUsedApps,
  useGetAppCount,
  useDeleteApp,
  useDeleteApps,
} from '@/api/hooks/useActivityHistory'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Trash2, Search, AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'
import { DateTime } from 'luxon'

const ITEMS_PER_PAGE = 50

export default function ActivityHistoryPage() {
  const [page, setPage] = useState(0)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [showDeleteSelectedDialog, setShowDeleteSelectedDialog] = useState(false)
  const [appToDelete, setAppToDelete] = useState<{ id: string; name: string } | null>(null)

  const { data: apps = [], isLoading } = useGetRecentlyUsedApps(ITEMS_PER_PAGE, page * ITEMS_PER_PAGE)
  const { data: totalCount = 0 } = useGetAppCount()
  const deleteAppMutation = useDeleteApp()
  const deleteAppsMutation = useDeleteApps()

  const filteredApps = apps.filter((app) => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      app.name?.toLowerCase().includes(query) ||
      app.app_external_id?.toLowerCase().includes(query)
    )
  })

  const handleDeleteApp = async (appId: string) => {
    try {
      await deleteAppMutation.mutateAsync(appId)
      toast.success('App and all its activity deleted')
      setSelectedIds(selectedIds.filter((id) => id !== appId))
      setAppToDelete(null)
    } catch {
      toast.error('Failed to delete app')
    }
  }

  const handleDeleteSelected = async () => {
    if (selectedIds.length === 0) return
    try {
      await deleteAppsMutation.mutateAsync(selectedIds)
      toast.success(`${selectedIds.length} apps deleted`)
      setSelectedIds([])
      setShowDeleteSelectedDialog(false)
    } catch {
      toast.error('Failed to delete apps')
    }
  }

  const toggleSelectApp = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((selectedId) => selectedId !== id))
    } else {
      setSelectedIds([...selectedIds, id])
    }
  }

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredApps.length) {
      setSelectedIds([])
    } else {
      setSelectedIds(filteredApps.map((a) => a.id))
    }
  }

  const formatRelativeTime = (timestamp: string) => {
    const dt = DateTime.fromISO(timestamp)
    const now = DateTime.now()
    const diff = now.diff(dt, ['days', 'hours', 'minutes']).toObject()

    if (diff.days && diff.days >= 1) {
      return dt.toFormat('MMM d, h:mm a')
    } else if (diff.hours && diff.hours >= 1) {
      return `${Math.floor(diff.hours)}h ago`
    } else if (diff.minutes && diff.minutes >= 1) {
      return `${Math.floor(diff.minutes)}m ago`
    } else {
      return 'Just now'
    }
  }

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE)

  return (
    <Layout>
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Recently Used Apps</h1>
          <p className="text-muted-foreground mt-2">
            Manage your tracked applications and their history. Total apps: {totalCount}
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>App History</CardTitle>
            <CardDescription>Applications you've recently used</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Search and Actions */}
              <div className="flex items-center gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by app name..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                {selectedIds.length > 0 && (
                  <Button
                    analyticsEvent="activity_history_delete_selected_clicked"
                    analyticsProperties={{ context: `${selectedIds.length} items` }}
                    variant="destructive"
                    onClick={() => setShowDeleteSelectedDialog(true)}
                  >
                    Delete Selected ({selectedIds.length})
                  </Button>
                )}
              </div>

              {/* App List */}
              {isLoading ? (
                <div className="text-center py-12 text-muted-foreground">Loading...</div>
              ) : filteredApps.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  {searchQuery ? 'No apps match your search' : 'No apps found'}
                </div>
              ) : (
                <>
                  {/* Select All */}
                  <div className="flex items-center gap-2 py-2 border-b">
                    <input
                      type="checkbox"
                      checked={selectedIds.length === filteredApps.length && filteredApps.length > 0}
                      onChange={toggleSelectAll}
                      className="h-4 w-4 rounded border-gray-300"
                    />
                    <span className="text-sm text-muted-foreground">Select all</span>
                  </div>

                  {/* App Items */}
                  <div className="space-y-2">
                    {filteredApps.map((app) => (
                      <div
                        key={app.id}
                        className="flex items-center gap-4 p-4 rounded-lg border hover:bg-accent/50 transition-colors"
                      >
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(app.id)}
                          onChange={() => toggleSelectApp(app.id)}
                          className="h-4 w-4 rounded border-gray-300"
                        />

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium">
                              {app.name || app.app_external_id}
                            </span>
                            {app.is_browser === 1 && (
                              <span className="text-xs px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30">
                                Browser
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground truncate">
                            {app.app_external_id}
                          </p>
                          <div className="flex items-center gap-4 mt-1">
                            <p className="text-xs text-muted-foreground">
                              Last used: {app.last_used ? formatRelativeTime(app.last_used) : 'Unknown'}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {app.activity_count?.toLocaleString() || 0} activities
                            </p>
                          </div>
                        </div>

                        <Button
                          analyticsEvent="activity_history_delete_clicked"
                          variant="ghost"
                          size="icon"
                          onClick={() => setAppToDelete({ id: app.id, name: app.name || app.app_external_id })}
                          disabled={deleteAppMutation.isPending}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between pt-4">
                  <div className="text-sm text-muted-foreground">
                    Page {page + 1} of {totalPages}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      analyticsEvent="activity_history_page_changed"
                      analyticsProperties={{ context: 'previous' }}
                      variant="outline"
                      onClick={() => setPage(page - 1)}
                      disabled={page === 0}
                    >
                      Previous
                    </Button>
                    <Button
                      analyticsEvent="activity_history_page_changed"
                      analyticsProperties={{ context: 'next' }}
                      variant="outline"
                      onClick={() => setPage(page + 1)}
                      disabled={page >= totalPages - 1}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Delete Single App Dialog */}
      <Dialog open={!!appToDelete} onOpenChange={(open) => !open && setAppToDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Delete App and Activity
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete <strong>{appToDelete?.name}</strong> and all of its activity history?
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button analyticsEvent="activity_history_delete_clicked" analyticsProperties={{ context: 'canceled' }} variant="outline" onClick={() => setAppToDelete(null)}>
              Cancel
            </Button>
            <Button
              analyticsEvent="activity_history_delete_clicked"
              analyticsProperties={{ context: 'confirmed' }}
              variant="destructive"
              onClick={() => appToDelete && handleDeleteApp(appToDelete.id)}
              disabled={deleteAppMutation.isPending}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Selected Dialog */}
      <Dialog open={showDeleteSelectedDialog} onOpenChange={setShowDeleteSelectedDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Selected Apps</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {selectedIds.length} selected {selectedIds.length === 1 ? 'app' : 'apps'} and all their activity history?
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button analyticsEvent="activity_history_delete_selected_clicked" analyticsProperties={{ context: 'canceled' }} variant="outline" onClick={() => setShowDeleteSelectedDialog(false)}>
              Cancel
            </Button>
            <Button
              analyticsEvent="activity_history_delete_selected_clicked"
              analyticsProperties={{ context: 'confirmed' }}
              variant="destructive"
              onClick={handleDeleteSelected}
              disabled={deleteAppsMutation.isPending}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  )
}

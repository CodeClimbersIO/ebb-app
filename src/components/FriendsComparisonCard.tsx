import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Users, UserPlus, Mail, Send, Check, X } from 'lucide-react'
import { formatTime } from '@/components/UsageSummary'
import { RangeMode } from '@/components/RangeModeSelector'
import { useState } from 'react'
import { useFriends, FriendRequest } from '@/api/hooks/useFriends'

export interface InviteState {
  hasFriends: boolean
  pendingInvitesSent: number
  pendingInvitesReceived: number
}

interface Friend {
  id: string
  name: string
  avatar?: string
  creatingTime: number
}

interface FriendComparisonProps {
  friends: Friend[]
  myTime: number
  rangeMode: RangeMode
}

const FriendComparison = ({ friends, myTime }: FriendComparisonProps) => {
  // Sort friends by creating time (descending)
  const sortedFriends = [...friends].sort((a, b) => b.creatingTime - a.creatingTime)
  const maxTime = Math.max(myTime, ...friends.map(f => f.creatingTime))
  const totalFriendsTime = friends.reduce((sum, friend) => sum + friend.creatingTime, 0)
  
  return (
    <div className="space-y-4">
      {/* My stats */}
      <div className="flex items-center gap-4 p-3 bg-primary/10 rounded-lg border-2 border-primary/20">
        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
          <span className="text-xs font-bold text-primary">Me</span>
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between mb-1">
            <span className="font-medium">You</span>
            <span className="text-sm font-medium text-primary">
              {formatTime(myTime)}
            </span>
          </div>
          <Progress
            value={(myTime / maxTime) * 100}
            className="h-2 bg-primary/10 [&>div]:bg-primary"
          />
        </div>
      </div>
      
      {/* Friends stats */}
      {sortedFriends.map((friend) => (
        <div key={friend.id} className="flex items-center gap-4 p-3 rounded-lg hover:bg-muted/50 transition-colors">
          <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
            <span className="text-xs font-bold text-muted-foreground">
              {friend.name.split(' ').map(n => n[0]).join('').toUpperCase()}
            </span>
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between mb-1">
              <span className="font-medium">{friend.name}</span>
              <div className="flex items-center gap-2">
                {friend.creatingTime > myTime && (
                  <Badge variant="secondary" className="text-xs">
                    +{formatTime(friend.creatingTime - myTime)}
                  </Badge>
                )}
                <span className="text-sm text-muted-foreground">
                  {formatTime(friend.creatingTime)}
                </span>
              </div>
            </div>
            <Progress
              value={(friend.creatingTime / maxTime) * 100}
              className="h-2"
            />
          </div>
          
        </div>
      ))}
      <div className="p-3 bg-muted/50 rounded-lg border">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-muted-foreground">Total Friends Creating Time</span>
          <span className="text-sm font-bold">
            {formatTime(totalFriendsTime)}
          </span>
        </div>
      </div>
    </div>
  )
}

interface PendingInvitesTabProps {
  onAcceptInvite: (inviteId: string) => void
  onDeclineInvite: (inviteId: string) => void
}

const PendingInvitesTab = ({ 
  onAcceptInvite,
  onDeclineInvite 
}: PendingInvitesTabProps) => {
  const { sentRequests, receivedRequests } = useFriends()
  const [visibleReceived, setVisibleReceived] = useState(5)
  const [visibleSent, setVisibleSent] = useState(5)

  const handleLoadMoreReceived = () => {
    setVisibleReceived(prev => prev + 5)
  }

  const handleLoadMoreSent = () => {
    setVisibleSent(prev => prev + 5)
  }

  return (
    <div className="space-y-6">
      {/* Received Invites */}
      {receivedRequests && receivedRequests.length > 0 && (
        <div>
          <h4 className="text-sm font-medium mb-3 text-primary">
            Received Invites ({receivedRequests.length})
          </h4>
          <div className="space-y-3">
            {receivedRequests.slice(0, visibleReceived).map((invite: FriendRequest) => (
              <div key={invite.id} className="flex items-center gap-4 p-3 bg-primary/10 rounded-lg border border-primary/20">
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                  <span className="text-xs font-bold text-primary">
                    {invite.from_auth_user_email?.slice(0, 2).toUpperCase()}
                  </span>
                </div>
                <div className="flex-1">
                  <div className="font-medium">Friend Request</div>
                  {invite.from_auth_user_email === 'rphovley@gmail.com' && (
                    <div className="text-xs text-muted-foreground">Paul Hovley (Ebb Founder)</div>
                  )}
                  <div className="text-xs text-muted-foreground">Email: {invite.from_auth_user_email || invite.to_email}</div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    onClick={() => onAcceptInvite(invite.id)}
                    className="h-8 px-3"
                  >
                    <Check className="h-3 w-3 mr-1" />
                    Accept
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onDeclineInvite(invite.id)}
                    className="h-8 px-3"
                  >
                    <X className="h-3 w-3 mr-1" />
                    Decline
                  </Button>
                </div>
              </div>
            ))}
          </div>
          {receivedRequests.length > visibleReceived && (
            <div className="text-center mt-4">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleLoadMoreReceived}
                className="text-xs"
              >
                Load More ({receivedRequests.length - visibleReceived} remaining)
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Sent Invites */}
      {sentRequests && sentRequests.length > 0 && (
        <div>
          <h4 className="text-sm font-medium mb-3 text-muted-foreground">
            Sent Invites ({sentRequests.length})
          </h4>
          <div className="space-y-3">
            {sentRequests.slice(0, visibleSent).map((invite: FriendRequest) => (
              <div key={invite.id} className="flex items-center gap-4 p-3 bg-muted/30 rounded-lg border border-muted">
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                  <Send className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1">
                  <div className="font-medium">To: {invite.to_email}</div>
                  <div className="text-xs text-muted-foreground">Status: {invite.status}</div>
                </div>
              </div>
            ))}
          </div>
          {sentRequests.length > visibleSent && (
            <div className="text-center mt-4">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleLoadMoreSent}
                className="text-xs"
              >
                Load More ({sentRequests.length - visibleSent} remaining)
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Empty state */}
      {(!sentRequests || sentRequests.length === 0) && (!receivedRequests || receivedRequests.length === 0) && (
        <div className="text-center py-8">
          <div className="w-12 h-12 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-3">
            <Mail className="h-6 w-6 text-muted-foreground" />
          </div>
          <p className="text-sm text-muted-foreground">No pending invites</p>
        </div>
      )}
    </div>
  )
}

interface EmptyFriendsStateProps {
  onInviteFriends: (email: string) => void
}

const EmptyFriendsState = ({ onInviteFriends }: EmptyFriendsStateProps) => {
  const [email, setEmail] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (email) {
      onInviteFriends(email)
      setEmail('')
    }
  }

  return (
    <div className="text-center py-12 px-6">
      <div className="flex justify-center mb-6">
        <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
          <Users className="h-10 w-10 text-primary" />
        </div>
      </div>
      <h3 className="text-xl font-semibold mb-3">Start Your Creating Journey Together</h3>
      <p className="text-muted-foreground mb-8 max-w-md mx-auto">
        Invite friends to see how your creating time compares and motivate each other to build more meaningful digital habits.
      </p>
      <form onSubmit={handleSubmit} className="w-full max-w-sm mx-auto">
        <div className="flex gap-2">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter friend's email"
            className="flex-1 px-3 py-2 rounded-md border border-input bg-background text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            required
          />
          <Button type="submit" size="lg" className="flex items-center gap-2">
            <Send className="h-5 w-5" />
            Invite
          </Button>
        </div>
      </form>
    </div>
  )
}

interface FriendsComparisonCardProps {
  friends: Friend[]
  myTime: number
  rangeMode: RangeMode
  inviteState: InviteState
  onInviteFriends: (email: string) => void
  onAcceptInvite?: (inviteId: string) => void
  onDeclineInvite?: (inviteId: string) => void
  getRangeModeText: () => string
}

export const FriendsComparisonCard = ({ 
  friends, 
  myTime, 
  rangeMode, 
  inviteState, 
  onInviteFriends,
  onAcceptInvite = () => {},
  onDeclineInvite = () => {},
  getRangeModeText 
}: FriendsComparisonCardProps) => {
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [email, setEmail] = useState('')
  const { sentRequests, receivedRequests } = useFriends()

  // Check if there are any pending invites
  const hasPending = (sentRequests && sentRequests.length > 0) || (receivedRequests && receivedRequests.length > 0)
  
  // Show tabs if there are friends OR pending invites
  const shouldShowTabs = inviteState.hasFriends || hasPending
  
  // Default to 'pending' tab if there are no friends but pending invites, otherwise 'friends'
  const defaultTab = !inviteState.hasFriends && hasPending ? 'pending' : 'friends'

  const handleInviteClick = () => {
    setShowInviteModal(true)
  }

  const handleInviteSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (email) {
      onInviteFriends(email)
      setEmail('')
      setShowInviteModal(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Friends Comparison
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              {inviteState.hasFriends 
                ? `How you compare to your friends ${getRangeModeText()}`
                : 'Start comparing with friends'
              }
            </p>
          </div>
          <Button variant="outline" size="sm" className="flex items-center gap-1" onClick={handleInviteClick}>
            <UserPlus className="h-4 w-4" />
            Invite Friends
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {shouldShowTabs ? (
          <Tabs defaultValue={defaultTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="friends">Friends ({friends.length})</TabsTrigger>
              <TabsTrigger value="pending" className="relative">
                Pending
                {inviteState.pendingInvitesReceived > 0 && (
                  <Badge variant="secondary" className="ml-2 h-5 px-1.5 text-xs bg-red-500 text-white hover:bg-red-600">
                    {inviteState.pendingInvitesReceived}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>
            <TabsContent value="friends" className="mt-6">
              {inviteState.hasFriends ? (
                <FriendComparison 
                  friends={friends}
                  myTime={myTime}
                  rangeMode={rangeMode}
                />
              ) : (
                <div className="text-center py-8">
                  <div className="w-12 h-12 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-3">
                    <Users className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <p className="text-sm text-muted-foreground">No friends yet</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Accept friend requests to start comparing!
                  </p>
                </div>
              )}
            </TabsContent>
            <TabsContent value="pending" className="mt-6">
              <PendingInvitesTab 
                onAcceptInvite={onAcceptInvite}
                onDeclineInvite={onDeclineInvite}
              />
            </TabsContent>
          </Tabs>
        ) : (
          <EmptyFriendsState onInviteFriends={onInviteFriends} />
        )}
      </CardContent>

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background p-6 rounded-lg shadow-lg max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Invite a Friend</h3>
            <form onSubmit={handleInviteSubmit}>
              <div className="space-y-4">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium mb-1">
                    Friend's Email
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter friend's email"
                    className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    required
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowInviteModal(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit">
                    Send Invite
                  </Button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </Card>
  )
} 

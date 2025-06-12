import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Users, UserPlus, Mail, Send, Check, X } from 'lucide-react'
import { formatTime } from '@/components/UsageSummary'
import { RangeMode } from '@/components/RangeModeSelector'

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

interface PendingInvite {
  id: string
  name: string
  email?: string
  type: 'sent' | 'received'
  avatar?: string
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
  pendingInvitesSent: number
  pendingInvitesReceived: number
  onAcceptInvite: (inviteId: string) => void
  onDeclineInvite: (inviteId: string) => void
}

const PendingInvitesTab = ({ 
  pendingInvitesSent, 
  pendingInvitesReceived,
  onAcceptInvite,
  onDeclineInvite 
}: PendingInvitesTabProps) => {
  // Mock pending invites data
  const mockSentInvites: PendingInvite[] = Array.from({ length: pendingInvitesSent }, (_, i) => ({
    id: `sent-${i}`,
    name: ['John Doe', 'Jane Smith'][i] || `User ${i + 1}`,
    email: ['john@example.com', 'jane@example.com'][i] || `user${i + 1}@example.com`,
    type: 'sent'
  }))

  const mockReceivedInvites: PendingInvite[] = Array.from({ length: pendingInvitesReceived }, (_, i) => ({
    id: `received-${i}`,
    name: ['Mike Chen', 'Lisa Wang'][i] || `Friend ${i + 1}`,
    email: ['mike@example.com', 'lisa@example.com'][i] || `friend${i + 1}@example.com`,
    type: 'received'
  }))

  return (
    <div className="space-y-6">
      {/* Received Invites */}
      {mockReceivedInvites.length > 0 && (
        <div>
          <h4 className="text-sm font-medium mb-3 text-primary">
            Received Invites ({mockReceivedInvites.length})
          </h4>
          <div className="space-y-3">
            {mockReceivedInvites.map((invite) => (
              <div key={invite.id} className="flex items-center gap-4 p-3 bg-primary/10 rounded-lg border border-primary/20">
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                  <span className="text-xs font-bold text-primary">
                    {invite.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                  </span>
                </div>
                <div className="flex-1">
                  <div className="font-medium">{invite.name}</div>
                  <div className="text-xs text-muted-foreground">{invite.email}</div>
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
        </div>
      )}

      {/* Sent Invites */}
      {mockSentInvites.length > 0 && (
        <div>
          <h4 className="text-sm font-medium mb-3 text-muted-foreground">
            Sent Invites ({mockSentInvites.length})
          </h4>
          <div className="space-y-3">
            {mockSentInvites.map((invite) => (
              <div key={invite.id} className="flex items-center gap-4 p-3 bg-muted/30 rounded-lg border border-muted">
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                  <Send className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1">
                  <div className="font-medium">{invite.email}</div>
                  <div className="text-xs text-muted-foreground">Awaiting response</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {mockSentInvites.length === 0 && mockReceivedInvites.length === 0 && (
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
  onInviteFriends: () => void
}

const EmptyFriendsState = ({ onInviteFriends }: EmptyFriendsStateProps) => (
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
    <Button onClick={onInviteFriends} size="lg" className="w-full max-w-sm mx-auto flex items-center gap-2">
      <Send className="h-5 w-5" />
      Invite Friends to Compare
    </Button>
  </div>
)

interface FriendsComparisonCardProps {
  friends: Friend[]
  myTime: number
  rangeMode: RangeMode
  inviteState: InviteState
  onInviteFriends: () => void
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
          <Button variant="outline" size="sm" className="flex items-center gap-1" onClick={onInviteFriends}>
            <UserPlus className="h-4 w-4" />
            Invite Friends
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {inviteState.hasFriends ? (
          <Tabs defaultValue="friends" className="w-full">
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
              <FriendComparison 
                friends={friends}
                myTime={myTime}
                rangeMode={rangeMode}
              />
            </TabsContent>
            <TabsContent value="pending" className="mt-6">
              <PendingInvitesTab 
                pendingInvitesSent={inviteState.pendingInvitesSent}
                pendingInvitesReceived={inviteState.pendingInvitesReceived}
                onAcceptInvite={onAcceptInvite}
                onDeclineInvite={onDeclineInvite}
              />
            </TabsContent>
          </Tabs>
        ) : (
          <EmptyFriendsState onInviteFriends={onInviteFriends} />
        )}
      </CardContent>
    </Card>
  )
} 

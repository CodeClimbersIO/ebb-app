import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useEffect, useRef } from 'react'
import { ApiError, platformApiRequest } from '../platformRequest'
import { logAndToastError } from '@/lib/utils/ebbError.util'
import { toast } from 'sonner'

// --- Backend types ---
export type FriendRequestStatus = 'pending' | 'accepted' | 'rejected' | 'cancelled'
export type FriendStatus = 'active' | 'blocked'

export interface FriendRequest {
  id: string
  from_user_id: string
  to_email: string
  status: FriendRequestStatus
  created_at: string
  updated_at: string
  message?: string | null
  expires_at?: string | null
  from_auth_user_email?: string | null
  to_auth_user_email?: string | null
}

export interface Friend {
  id: string
  user_id_1: string
  user_id_2: string
  status: FriendStatus
  created_at: string
  updated_at: string
  creating_time: number
}

export interface FriendRequestWithUser extends FriendRequest {
  from_auth_user_email?: string
  to_auth_user_email?: string
}

export interface FriendWithDetails {
  id: string
  friend_id: string
  friend_email: string
  created_at: string
  updated_at: string
  creating_time: number
}

// Dashboard insights types
export interface DashboardInsightsResponse {
  userActivity: {
    totalMinutes: number
    minutesFormatted: string
  }
  topFriend: {
    hasFriends: boolean
    topFriendEmail?: string
    topFriendMinutes?: number
    topFriendFormatted?: string
  }
  userPercentile: {
    percentile: number
    betterThanPercent: number
  }
  communityComparison: {
    userMinutes: number
    userFormatted: string
    communityAverage: number
    communityAverageFormatted: string
    differenceMinutes: number
    differenceFormatted: string
    isAboveAverage: boolean
  }
  communityStats: {
    totalCommunityMinutes: number
    totalCommunityFormatted: string
    activeUsers: number
  }
}

const friendKeys = {
  all: ['friends'] as const,
  list: () => [...friendKeys.all, 'list'] as const,
  sentRequests: () => [...friendKeys.all, 'sent'] as const,
  receivedRequests: () => [...friendKeys.all, 'received'] as const,
  dashboardInsights: (date: string) => [...friendKeys.all, 'dashboardInsights', date] as const,
}

const getFriends = async () => {
  const data = await platformApiRequest({
    url: '/api/friends/list',
    method: 'GET',
  })
  return data as FriendWithDetails[]
}

const getPendingRequestsSent = async () => {
  const data = await platformApiRequest({
    url: '/api/friends/requests/sent',
    method: 'GET',
  })
  return data as FriendRequest[]
}

const getPendingRequestsReceived = async () => {
  const data = await platformApiRequest({
    url: '/api/friends/requests/received',
    method: 'GET',
  })
  return data as FriendRequest[]
}

const getDashboardInsights = async (date: string) => {
  const data = await platformApiRequest({
    url: `/api/friends/dashboard-insights?date=${date}`,
    method: 'GET',
  })
  return data as DashboardInsightsResponse
}

const inviteFriend = async (email: string) => {
  const data = await platformApiRequest({
    url: '/api/friends/invite',
    method: 'POST',
    body: { to_email: email },
  })
  return data
}

const respondToFriendRequest = async ({ requestId, action }: { requestId: string; action: 'accept' | 'reject' }) => {
  const data = await platformApiRequest({
    url: `/api/friends/requests/${requestId}/respond`,
    method: 'POST',
    body: { action },
  })
  return data
}

export function useGetFriends() {
  return useQuery({
    queryKey: friendKeys.list(),
    queryFn: getFriends,
  })
}

export function useGetPendingRequestsSent() {
  return useQuery({
    queryKey: friendKeys.sentRequests(),
    queryFn: getPendingRequestsSent,
  })
}

export function useGetPendingRequestsReceived() {
  return useQuery({
    queryKey: friendKeys.receivedRequests(),
    queryFn: getPendingRequestsReceived,
  })
}

export function useGetDashboardInsights(date: string) {
  return useQuery({
    queryKey: friendKeys.dashboardInsights(date),
    queryFn: () => getDashboardInsights(date),
    enabled: !!date,
  })
}

type ApiErrorType = {
  error?: string;
  message?: string;
  data?: {
    error?: string;
    message?: string;
  };
};

export function useInviteFriend() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: inviteFriend,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: friendKeys.all })
    },
    onError: (error: ApiErrorType) => {
      // Try to extract the error message from the API response
      const apiMessage = error?.error || error?.message || error?.data?.error || error?.data?.message
      if (apiMessage === 'You cannot send a friend request to yourself') {
        logAndToastError('You cannot invite yourself as a friend.', error)
      } else if (apiMessage === 'Friend request already sent to this email') {
        logAndToastError('You have already sent a friend request to this email.', error)
      } else if (apiMessage === 'You are already friends with this user') {
        logAndToastError('You are already friends with this user.', error)
      } else if (apiMessage === 'Valid email address is required') {
        logAndToastError('Please enter a valid email address.', error)
      } else {
        logAndToastError('Failed to send friend request', error)
      }
    },
  })
}

export function useRespondToFriendRequest() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: respondToFriendRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: friendKeys.all })
    },
    onError: (error) => {
      if (error instanceof ApiError && error.statusCode === 403) {
        toast.error('Sorry, looks like you may not be logged into the correct account for this invite.')
      } else {
        logAndToastError('Failed to respond to friend request', error)
      }
    },
  })
}

export const useFriends = () => {
  const { data: friends, isLoading: isLoadingFriends } = useGetFriends()
  const { data: sentRequests, isLoading: isLoadingSentRequests } = useGetPendingRequestsSent()
  const { data: receivedRequests, isLoading: isLoadingReceivedRequests } = useGetPendingRequestsReceived()
  const { mutateAsync: inviteFriend, isPending: isInviting } = useInviteFriend()
  const { mutateAsync: respondToRequest, isPending: isResponding } = useRespondToFriendRequest()

  const isLoading = isLoadingFriends || isLoadingSentRequests || isLoadingReceivedRequests

  const handleInviteFriend = (email: string) => {
    inviteFriend(email)
  }

  const handleAcceptInvite = async (requestId: string) => {
    await respondToRequest({ requestId, action: 'accept' })
  }

  const handleDeclineInvite = async (requestId: string) => {
    await respondToRequest({ requestId, action: 'reject' })
  }

  return {
    friends,
    sentRequests,
    receivedRequests,
    isLoading,
    isInviting,
    isResponding,
    handleInviteFriend,
    handleAcceptInvite,
    handleDeclineInvite,
  }
}

// Enhanced hook with dashboard insights
export const useFriendsWithInsights = () => {
  const today = new Date()
  const date = today.toISOString().split('T')[0]
  const queryClient = useQueryClient()
  const refreshIntervalRef = useRef<number | null>(null)
  
  const friendsData = useFriends()
  const { data: dashboardInsights, isLoading: isLoadingInsights } = useGetDashboardInsights(date)

  const pendingInvitesReceivedCount = friendsData.receivedRequests && friendsData.receivedRequests.length > 0 ? friendsData.receivedRequests.length : 0
  const hasPendingInvitesReceived = pendingInvitesReceivedCount > 0
  
  const hasFriends = friendsData.friends && friendsData.friends.length > 0

  useEffect(() => {
    const refreshData = () => {
      queryClient.invalidateQueries({ queryKey: friendKeys.all })
    }

    refreshIntervalRef.current = window.setInterval(refreshData, 5 * 60 * 1000) // 5 minutes

    const handleFocus = () => {
      console.log('handleFocus')
      refreshData()
    }
    window.addEventListener('focus', handleFocus)

    return () => {
      if (refreshIntervalRef.current !== null) {
        clearInterval(refreshIntervalRef.current)
      }
      window.removeEventListener('focus', handleFocus)
    }
  }, [queryClient])
  
  return {
    ...friendsData,
    dashboardInsights,
    isLoading: friendsData.isLoading || isLoadingInsights,
    hasPendingInvitesReceived,
    hasFriends,
    pendingInvitesReceivedCount,
  }
}

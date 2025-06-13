import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { platformApiRequest } from '../platformRequest'
import { logAndToastError } from '@/lib/utils/ebbError.util'

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
}

const friendKeys = {
  all: ['friends'] as const,
  list: () => [...friendKeys.all, 'list'] as const,
  sentRequests: () => [...friendKeys.all, 'sent'] as const,
  receivedRequests: () => [...friendKeys.all, 'received'] as const,
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

const inviteFriend = async (email: string) => {
  const data = await platformApiRequest({
    url: '/api/friends/invite',
    method: 'POST',
    body: { to_email: email },
  })
  return data
}

const respondToFriendRequest = async ({ requestId, accept }: { requestId: string; accept: boolean }) => {
  const data = await platformApiRequest({
    url: `/api/friends/requests/${requestId}/respond`,
    method: 'POST',
    body: { accept },
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
      queryClient.invalidateQueries({ queryKey: friendKeys.sentRequests() })
    },
    onError: (error: ApiErrorType) => {
      // Try to extract the error message from the API response
      console.log('error', error)
      const apiMessage = error?.error || error?.message || error?.data?.error || error?.data?.message
      console.log('apiMessage', apiMessage)
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
      logAndToastError('Failed to respond to friend request', error)
    },
  })
}

export const useFriends = () => {
  const { data: friends, isLoading: isLoadingFriends } = useGetFriends()
  const { data: sentRequests, isLoading: isLoadingSentRequests } = useGetPendingRequestsSent()
  const { data: receivedRequests, isLoading: isLoadingReceivedRequests } = useGetPendingRequestsReceived()
  const { mutate: inviteFriend } = useInviteFriend()
  const { mutate: respondToRequest } = useRespondToFriendRequest()

  const isLoading = isLoadingFriends || isLoadingSentRequests || isLoadingReceivedRequests

  const handleInviteFriend = (email: string) => {
    inviteFriend(email)
  }

  const handleAcceptInvite = (requestId: string) => {
    respondToRequest({ requestId, accept: true })
  }

  const handleDeclineInvite = (requestId: string) => {
    respondToRequest({ requestId, accept: false })
  }

  return {
    friends,
    sentRequests,
    receivedRequests,
    isLoading,
    handleInviteFriend,
    handleAcceptInvite,
    handleDeclineInvite,
  }
}

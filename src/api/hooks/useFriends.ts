import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { platformApiRequest } from '../platformRequest'
import { logAndToastError } from '@/lib/utils/ebbError.util'

const friendKeys = {
  all: ['friends'] as const,
  list: () => [...friendKeys.all, 'list'] as const,
  sentRequests: () => [...friendKeys.all, 'sent'] as const,
  receivedRequests: () => [...friendKeys.all, 'received'] as const,
}

export type Friend = {
  id: string
  name: string
  avatar?: string
  creatingTime: number
}

export type FriendRequest = {
  id: string
  senderId: string
  receiverId: string
  status: 'pending' | 'accepted' | 'declined'
  createdAt: string
  updatedAt: string
}

const getFriends = async () => {
  const data = await platformApiRequest({
    url: '/api/friends/list',
    method: 'GET',
  })
  return data as Friend[]
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
    body: { email },
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

export function useInviteFriend() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: inviteFriend,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: friendKeys.sentRequests() })
    },
    onError: (error) => {
      logAndToastError('Failed to send friend request', error)
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

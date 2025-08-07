import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { WorkflowApi, Workflow } from '../ebbApi/workflowApi'
import { logAndToastError } from '@/lib/utils/ebbError.util'

export const useGetWorkflows = () => {
  return useQuery({
    queryKey: ['workflows'],
    queryFn: () => WorkflowApi.getWorkflows(),
  })
}

export const useGetWorkflowById = (id: string) => {
  return useQuery({
    queryKey: ['workflow', id],
    queryFn: () => WorkflowApi.getWorkflowById(id),
    enabled: !!id,
  })
}

export const useSaveWorkflow = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (workflow: Workflow) => WorkflowApi.saveWorkflow(workflow),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflows'] })
    },
    onError: (error) => {
      logAndToastError('Failed to save workflow', error)
    },
  })
}

export const useDeleteWorkflow = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (id: string) => WorkflowApi.deleteWorkflow(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflows'] })
    },
    onError: (error) => {
      logAndToastError('Failed to delete workflow', error)
    },
  })
}

export const useUpdateLastSelected = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (id: string) => WorkflowApi.updateLastSelected(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflows'] })
    },
    onError: (error) => {
      logAndToastError('Failed to update workflow', error)
    },
  })
}

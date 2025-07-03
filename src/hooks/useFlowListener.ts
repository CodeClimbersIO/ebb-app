import { FlowSessionApi } from '@/api/ebbApi/flowSessionApi'
import { WorkflowApi } from '@/api/ebbApi/workflowApi'
import { listen, UnlistenFn } from '@tauri-apps/api/event'
import { info } from '@tauri-apps/plugin-log'
import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'

export const useFlowListener = () => {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  useEffect(() => {
    let unlistenReloadState: UnlistenFn | undefined
    let unlistenNavigate: UnlistenFn | undefined

    const setupListener = async () => {
      unlistenReloadState = await listen('notification-dismissed', async () => {
        info('App:relead state')
        queryClient.invalidateQueries()
        const flowSession = await FlowSessionApi.getInProgressFlowSession()
        if (flowSession) {
          navigate('/flow')
        }
      })
      unlistenNavigate = await listen('navigate-to-flow-recap', async () => {
        info('App: navigating to flow recap')
        navigate('/flow-recap')
      })
    }

    void setupListener()

    return () => {
      unlistenReloadState?.()
      unlistenNavigate?.()
    }
  }, []) 
  const init = async () => {
    const flowSession = await FlowSessionApi.getInProgressFlowSession()
    if (flowSession) {
      navigate('/flow')
    }
    window.addEventListener('flow-session-started', async ()=>{
      const flowSession = await FlowSessionApi.getInProgressFlowSession()
      if (!flowSession || !flowSession.workflow_id) return
      const workflow = await WorkflowApi.getWorkflowById(flowSession.workflow_id)
      if (workflow?.settings.hasBreathing) {
        navigate('/breathing-exercise')
      } else {
        navigate('/flow')
      }
    })
  }
  init()
}

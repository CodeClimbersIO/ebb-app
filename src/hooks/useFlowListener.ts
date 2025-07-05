import { FlowSessionApi } from '@/api/ebbApi/flowSessionApi'
import { WorkflowApi } from '@/api/ebbApi/workflowApi'
import { useNavigate } from 'react-router-dom'

export const useFlowListener = () => {
  const navigate = useNavigate()
  
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

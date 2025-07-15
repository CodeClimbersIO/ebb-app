import { FlowSessionApi } from '@/api/ebbApi/flowSessionApi'
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
      navigate('/flow')
    })
  }
  init()
}

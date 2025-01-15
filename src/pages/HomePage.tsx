import { Layout } from '@/components/Layout'
import { useNavigate } from 'react-router-dom'
import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Activity } from 'lucide-react'
import { StatsCards } from '@/components/StatCard'
import { FlowSessions } from '@/components/FlowSessions'
import { FlowSessionApi } from '../api/ebbApi/flowSessionApi'
import { useSettings } from '../hooks/useSettings'

export const HomePage = () => {
  const { showZeroState } = useSettings()
  const navigate = useNavigate()
  useEffect(() => {
    const init = async () => {
      const flowSession = await FlowSessionApi.getInProgressFlowSession()
      if (flowSession) {
        navigate('/flow')
      }
    }
    init()
  }, [])

  const handleStartFlowSession = () => {
    navigate('/start-flow')
  }

  if (showZeroState) {
    return (
      <Layout>
        <div className="p-8">
          <div className="max-w-5xl mx-auto">
            <h1 className="text-2xl font-semibold mb-8">Welcome, Nathan</h1>
            <div className="border rounded-lg p-8 text-center">
              <h2 className="text-xl font-medium mb-4">Ready to start your flow journey?</h2>
              <p className="text-muted-foreground mb-6">
                When it's time to lock in and improve your focus
              </p>
              <Button size="lg" onClick={handleStartFlowSession}>
                <Activity className="mr-2 h-5 w-5" />
                Start First Flow Session
              </Button>
            </div>
          </div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="p-8">
        <div className="max-w-5xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-2xl font-semibold">Welcome, Nathan</h1>
            <Button variant="default" onClick={handleStartFlowSession}>
              <Activity className="mr-2 h-5 w-5" />
              Enter Flow
            </Button>
          </div>
          <StatsCards />
          <div className="mt-8">
            <FlowSessions />
          </div>
        </div>
      </div>
    </Layout>
  )
}

import { Button } from "@/components/ui/button"
import { Activity } from 'lucide-react'
import { StatsCards } from "@/components/StatCard"
import { FlowSessions } from "@/components/FlowSessions"
import { Layout } from "@/components/Layout"
import { useNavigate } from "react-router-dom"

export const HomePage = () => {
  const navigate = useNavigate()

  const handleStartFlowSession = () => {
    navigate('/start-flow')
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

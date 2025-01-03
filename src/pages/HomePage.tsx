import { useEffect } from 'react';
import { Button } from "@/components/ui/button"
import { Activity } from 'lucide-react'
import { Sidebar } from "@/components/Sidebar"
import { StatsCards } from "@/components/StatCard"
import { FlowSessions } from "@/components/FlowSessions"
import { EbbApi } from '../api/ebbApi';
import { MonitorApi } from '../api/monitorApi';



export const HomePage = () => {
  useEffect(() => {
    const init = async () => {
      const activities = await MonitorApi.getActivities();
      console.log(activities)
      const flowSessions = await EbbApi.getFlowSessions();
      console.log(flowSessions)
    }
    init()
  }, [])

  const handleStartFlowSession = async () => {
    const flowSession = await EbbApi.startFlowSession('Learn React');
    console.log(flowSession)
  }


  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex-1 overflow-y-auto">
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
      </div>
    </div>
  )
}

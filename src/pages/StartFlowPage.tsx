import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Activity } from 'lucide-react'
import { EbbApi } from "../api/ebbApi"
import { TopNav } from "@/components/TopNav"
import { LogoContainer } from "@/components/LogoContainer"

export const StartFlowPage = () => {
  const [objective, setObjective] = useState("")
  const navigate = useNavigate()

  const handleBegin = async () => {
    if (!objective) return
    await EbbApi.startFlowSession(objective)
    navigate('/')
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleBegin()
    }
  }

  return (
    <div className="flex flex-col h-screen">
      <div className="flex">
        <LogoContainer />
        <TopNav variant="modal" />
      </div>
      <div className="flex-1 flex items-center justify-center bg-background/80 backdrop-blur-sm">
        <Card className="w-[400px]">
          <CardContent className="pt-6">
            <div className="mb-4">
              <h2 className="text-lg font-semibold mb-2">What is your main objective for this session?</h2>
              <Input
                placeholder="💡 Code new side project"
                value={objective}
                onChange={(e) => setObjective(e.target.value)}
                onKeyDown={handleKeyDown}
                className="w-full"
              />
            </div>
            <Button 
              className="w-full" 
              onClick={handleBegin}
              disabled={!objective}
            >
              <Activity className="mr-2 h-5 w-5" />
              Enter Flow
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 
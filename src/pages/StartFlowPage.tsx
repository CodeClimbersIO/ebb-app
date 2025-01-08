import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { EbbApi } from "../api/ebbApi"
import { Activity, X } from 'lucide-react'
import { Logo } from "@/components/ui/logo"

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
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm">
      <div className="fixed top-0 left-0 right-0 flex justify-between items-center p-4">
        <Logo className="px-3" />
        <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
          <X className="h-5 w-5" />
        </Button>
      </div>

      <div className="fixed left-[50%] top-[50%] translate-x-[-50%] translate-y-[-50%]">
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
import { Button } from "@/components/ui/button"
import { UserCircle, X } from 'lucide-react'
import { useNavigate } from "react-router-dom"

interface TopNavProps {
  variant?: 'default' | 'modal'
}

export function TopNav({ variant = 'default' }: TopNavProps) {
  const navigate = useNavigate()

  return (
    <div className="h-14 border-b w-full flex items-center px-4">
      <div className="flex-1" />
      <div className="flex items-center gap-2">
        {variant === 'default' ? (
          <Button variant="ghost" size="icon" className="rounded-full">
            <UserCircle className="h-6 w-6" />
          </Button>
        ) : (
          <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
            <X className="h-6 w-6" />
          </Button>
        )}
      </div>
    </div>
  )
} 
import { Button } from '@/components/ui/button'
import { UserCircle, X, LogOut } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { getAuth, signOut } from 'firebase/auth'

interface TopNavProps {
  variant?: 'default' | 'modal'
}

export function TopNav({ variant = 'default' }: TopNavProps) {
  const navigate = useNavigate()
  const auth = getAuth()

  const handleLogout = async () => {
    try {
      await signOut(auth)
      navigate('/login')
    } catch (error) {
      console.error('Failed to log out:', error)
    }
  }

  return (
    <div className="h-14 border-b w-full flex items-center px-4">
      <div className="flex-1" />
      <div className="flex items-center gap-2">
        {variant === 'default' ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full">
                <UserCircle className="h-6 w-6" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleLogout} className="cursor-pointer">
                <LogOut className="mr-2 h-4 w-4" />
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
            <X className="h-6 w-6" />
          </Button>
        )}
      </div>
    </div>
  )
} 

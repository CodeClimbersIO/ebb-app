import { Button } from '@/components/ui/button'
import { Home, Users, Settings, UserCircle, LogOut } from 'lucide-react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { LogoContainer } from './LogoContainer'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import supabase from '@/lib/integrations/supabase'
import { useAuth } from '@/hooks/useAuth'

export function Sidebar() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuth()

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      navigate('/login')
    } catch (error) {
      console.error('Failed to logout:', error)
    }
  }

  const displayName = user?.user_metadata?.full_name || 
                     user?.user_metadata?.name || 
                     user?.email?.split('@')[0] || 
                     'User'

  return (
    <div className="w-56 border-r h-screen flex flex-col">
      <LogoContainer />
      <nav className="px-3 pt-4 space-y-2 flex-1">
        <Button 
          variant="ghost"
          className={`w-full justify-start gap-3 px-3 text-muted-foreground [&>svg]:text-muted-foreground ${
            location.pathname === '/' ? 'text-foreground [&>svg]:text-foreground' : ''
          }`}
          asChild
        >
          <Link to="/">
            <Home />
            Today
          </Link>
        </Button>
        <Button 
          variant="ghost"
          className={`w-full justify-start gap-3 px-3 text-muted-foreground [&>svg]:text-muted-foreground ${
            location.pathname === '/friends' ? 'text-foreground [&>svg]:text-foreground' : ''
          }`}
          asChild
        >
          <Link to="/friends">
            <Users className="h-5 w-5" />
            Friends
          </Link>
        </Button>
        <Button 
          variant="ghost"
          className={`w-full justify-start gap-3 px-3 text-muted-foreground [&>svg]:text-muted-foreground ${
            location.pathname === '/settings' ? 'text-foreground [&>svg]:text-foreground' : ''
          }`}
          asChild
        >
          <Link to="/settings">
            <Settings className="h-5 w-5" />
            Settings
          </Link>
        </Button>
      </nav>
      <div className="p-4 border-t">
        <div className="rounded-lg p-4 bg-muted/50">
          <h3 className="font-semibold text-lg">14 days left</h3>
          <p className="text-sm text-muted-foreground mt-2">
            Your Ebb Pro free trial ends soon.
          </p>
          <Button className="w-full mt-4 bg-gray-500 hover:bg-gray-600" disabled>
            Coming soon
          </Button>
        </div>
      </div>
      <div className="p-4 border-t">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="w-full justify-start gap-3 px-3 text-muted-foreground [&>svg]:text-muted-foreground">
              <UserCircle className="h-5 w-5" />
              {displayName}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuItem onClick={handleLogout} className="cursor-pointer">
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}

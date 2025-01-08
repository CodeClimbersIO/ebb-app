import { Button } from '@/components/ui/button'
import { Activity, Users, Settings } from 'lucide-react'
import { Link } from 'react-router-dom'
import { LogoContainer } from './LogoContainer'

export function Sidebar() {
  return (
    <div className="w-64 border-r h-screen flex flex-col">
      <LogoContainer />
      <nav className="px-3 pt-4 space-y-2 flex-1">
        <Button variant="ghost" className="w-full justify-start gap-3 px-3" asChild>
          <Link to="/">
            <Activity className="h-5 w-5" />
            Flow
          </Link>
        </Button>
        <Button variant="ghost" className="w-full justify-start gap-3 px-3" asChild>
          <Link to="/friends">
            <Users className="h-5 w-5" />
            Friends
            <span className="ml-auto bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
              1
            </span>
          </Link>
        </Button>
        <Button variant="ghost" className="w-full justify-start gap-3 px-3" asChild>
          <Link to="/settings">
            <Settings className="h-5 w-5" />
            Settings
          </Link>
        </Button>
      </nav>
      <div className="p-4 border-t">
        <div className="rounded-lg p-4 bg-muted/50">
          <h3 className="font-semibold text-lg">Upgrade to Pro</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Sync across all your devices and get a full picture of your flow state
          </p>
          <Button className="w-full mt-4 bg-gray-500 hover:bg-gray-600" disabled>
            Coming Soon
          </Button>
        </div>
      </div>
    </div>
  )
}

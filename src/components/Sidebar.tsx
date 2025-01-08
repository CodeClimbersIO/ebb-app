import { Button } from "@/components/ui/button"
import { Activity, Users, Settings } from 'lucide-react'
import { Link } from "react-router-dom"
import { Logo } from "@/components/ui/logo"

export function Sidebar() {
  return (
    <div className="w-64 border-r h-screen p-4 flex flex-col">
      <div className="mb-8">
        <Logo className="px-3" />
      </div>
      <nav className="space-y-2 flex-1">
        <Button variant="ghost" className="w-full justify-start gap-2" asChild>
          <Link to="/">
            <Activity className="h-4 w-4" />
            Flow
          </Link>
        </Button>
        <Button variant="ghost" className="w-full justify-start gap-2" asChild>
          <Link to="/friends">
            <Users className="h-4 w-4" />
            Friends
            <span className="ml-auto bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
              1
            </span>
          </Link>
        </Button>
        <Button variant="ghost" className="w-full justify-start gap-2" asChild>
          <Link to="/settings">
            <Settings className="h-4 w-4" />
            Settings
          </Link>
        </Button>
      </nav>
      <div className="border rounded-lg p-4">
        <h3 className="font-semibold text-lg">Upgrade to Pro</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Sync across all your devices and get a full picture of your flow state
        </p>
        <Button className="w-full mt-4 bg-gray-500 hover:bg-gray-600" disabled>
          Coming Soon
        </Button>
      </div>
    </div>
  )
}
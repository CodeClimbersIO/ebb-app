import { Sidebar } from './Sidebar'
import { TopNav } from './TopNav'
import { NotificationBanner } from './NotificationBanner'

interface LayoutProps {
  children: React.ReactNode
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="h-screen flex flex-col">
      <div className="w-full">
        <TopNav />
        <NotificationBanner />
      </div>
      <div className="flex-1 flex min-h-0">
        <Sidebar />
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  )
} 

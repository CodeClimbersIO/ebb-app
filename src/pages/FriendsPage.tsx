import { Sidebar } from "@/components/Sidebar"

export const FriendsPage = () => {
  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex-1 overflow-y-auto">
        <div className="p-8">
          <div className="max-w-5xl mx-auto">
            <h1 className="text-2xl font-semibold mb-8">Coming Soon</h1>
          </div>
        </div>
      </div>
    </div>
  )
} 
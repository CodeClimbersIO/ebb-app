import { useEffect } from 'react';
import Database from '@tauri-apps/plugin-sql';
import { homeDir, join } from '@tauri-apps/api/path';
import { Button } from "@/components/ui/button"
import { Activity } from 'lucide-react'
import { Sidebar } from "@/components/Sidebar"
import { StatsCards } from "@/components/StatCard"
import { FlowSessions } from "@/components/FlowSessions"

export const HomePage = () => {
  useEffect(() => {
    const init = async () => {
      const homeDirectory = await homeDir();
      const dbPath = await join(homeDirectory, '.codeclimbers', 'codeclimbers-desktop.sqlite');
      console.log(dbPath)
      const db = await Database.load(`sqlite:${dbPath}`);
      const s = await db.select('SELECT * FROM activity LIMIT 10;');
      console.log(s)

      // const x = await db.execute('INSERT INTO activity (activity_type, app_name, app_window_title, timestamp) VALUES (?, ?, ?, ?)',
      //   ['WINDOW', 'app', 'window', '2024-01-01 00:00:00']);
      // console.log(x)
    }
    init()
  }, [])
  return (
    <div className="flex h-screen">
      <Sidebar />
      <main className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-4xl">
          <h1 className="text-2xl font-semibold mb-8">Welcome, Nathan</h1>
          
          <div className="mb-8">
            <Button className="w-full max-w-md bg-purple-600 hover:bg-purple-700" size="lg">
              <Activity className="mr-2 h-5 w-5" />
              Enter Flow
            </Button>
          </div>

          <StatsCards />
          
          <div className="mt-8">
            <FlowSessions />
          </div>
        </div>
      </main>
    </div>
  )
}

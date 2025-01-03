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
      <div className="flex-1 overflow-y-auto">
        <div className="p-8">
          <div className="max-w-5xl mx-auto">
            <div className="flex justify-between items-center mb-8">
              <h1 className="text-2xl font-semibold">Welcome, Nathan</h1>
              <Button variant="default">
                <Activity className="mr-2 h-5 w-5" />
                Enter Flow
              </Button>
            </div>

            <StatsCards />
            
            <div className="mt-8">
              <FlowSessions />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

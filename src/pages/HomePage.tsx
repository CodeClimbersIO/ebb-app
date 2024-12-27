
import { useEffect } from 'react';
import { ThemeToggleComponent } from '../components/ThemeToggleComponent'
import Database from '@tauri-apps/plugin-sql';
import { homeDir, join } from '@tauri-apps/api/path';


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
    <div>
      HomePage
      <ThemeToggleComponent />
    </div>
  )
}

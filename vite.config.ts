import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { sentryVitePlugin } from '@sentry/vite-plugin'

const host = process.env.TAURI_DEV_HOST

// https://vitejs.dev/config/
export default defineConfig(async () => {
  const isE2E = process.env.VITE_E2E === '1'
  return ({
    build: {
      sourcemap: true,
      rollupOptions: {
        input: {
          main: path.resolve(__dirname, 'index.html'),
          notification: path.resolve(__dirname, 'notification.html')
        }
      }
    },
    plugins: [
      react(),
      // Disable Sentry in e2e to avoid network work
      !isE2E && sentryVitePlugin({
        authToken: process.env.SENTRY_AUTH_TOKEN,
        org: 'ebb-lb',
        project: 'ebb-tauri-react',
      }),
    ].filter(Boolean),
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
        ...(isE2E ? {
          '@tauri-apps/api/core': path.resolve(__dirname, 'src/tests/mocks/tauri/core.ts'),
          '@tauri-apps/api/event': path.resolve(__dirname, 'src/tests/mocks/tauri/event.ts'),
          '@tauri-apps/api/window': path.resolve(__dirname, 'src/tests/mocks/tauri/window.ts'),
          '@tauri-apps/api/path': path.resolve(__dirname, 'src/tests/mocks/tauri/path.ts'),
          '@tauri-apps/api/tray': path.resolve(__dirname, 'src/tests/mocks/tauri/tray.ts'),
          '@tauri-apps/api/menu': path.resolve(__dirname, 'src/tests/mocks/tauri/menu.ts'),
          '@tauri-apps/api/image': path.resolve(__dirname, 'src/tests/mocks/tauri/image.ts'),
          '@tauri-apps/plugin-sql': path.resolve(__dirname, 'src/tests/mocks/tauri/sql.ts'),
          '@tauri-apps/plugin-log': path.resolve(__dirname, 'src/tests/mocks/tauri/log.ts'),
          '@tauri-apps/plugin-os': path.resolve(__dirname, 'src/tests/mocks/tauri/os.ts'),
          '@tauri-apps/plugin-process': path.resolve(__dirname, 'src/tests/mocks/tauri/process.ts'),
          '@tauri-apps/plugin-updater': path.resolve(__dirname, 'src/tests/mocks/tauri/updater.ts'),
          '@tauri-apps/plugin-deep-link': path.resolve(__dirname, 'src/tests/mocks/tauri/deep-link.ts'),
          '@tauri-apps/plugin-shell': path.resolve(__dirname, 'src/tests/mocks/tauri/shell.ts'),
          '@/lib/integrations/supabase': path.resolve(__dirname, 'src/tests/mocks/integrations/supabase.ts'),
          '@/lib/integrations/spotify/spotifyApi': path.resolve(__dirname, 'src/tests/mocks/integrations/spotifyApi.ts'),
          '@/lib/integrations/spotify/spotifyAuth': path.resolve(__dirname, 'src/tests/mocks/integrations/spotifyAuth.ts'),
        } : {})
      },
    },
    // Vite options tailored for Tauri development and only applied in `tauri dev` or `tauri build`
    //
    // 1. prevent vite from obscuring rust errors
    clearScreen: false,
    // 2. tauri expects a fixed port, fail if that port is not available
    server: {
      port: 1420,
      strictPort: true,
      host: host || false,
      hmr: host
        ? {
          protocol: 'ws',
          host,
          port: 1421,
        }
        : undefined,
      watch: {
      // 3. tell vite to ignore watching `src-tauri`
        ignored: ['**/src-tauri/**', 'server/**'],
      },
    },
  })
})

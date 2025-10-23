import './App.css'
import { AppRouter } from './routes'
import { ThemeProvider } from '@/components/ThemeProvider'

import { Toaster } from '@/components/ui/sonner'
import { TooltipProvider } from '@radix-ui/react-tooltip'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useInitializeAppState } from './hooks/useInitializeAppState'
import { SpotifyConfetti } from '@/components/SpotifyConfetti'
import { useSpotifyEasterEgg } from '@/hooks/useSpotifyEasterEgg'
import { PaywallDialog } from '@/components/PaywallDialog'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 30, // 30 minutes
    },
  },
})

const AppRouterWrapper = () => {
  useInitializeAppState()
  const { showConfetti, isSpotifyTheme } = useSpotifyEasterEgg()

  return (
    <>
      <AppRouter />
      <SpotifyConfetti show={showConfetti} isSpotifyTheme={isSpotifyTheme} />
    </>
  )
}

const App = () => {

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
        <TooltipProvider>
          <AppRouterWrapper />
          <Toaster position="bottom-right" richColors />
          <PaywallDialog />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  )
}

export default App

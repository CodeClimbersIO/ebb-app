import { useEffect } from 'react'
import confetti from 'canvas-confetti'

interface SpotifyConfettiProps {
  show: boolean
  isSpotifyTheme: boolean
}

const SPOTIFY_GREEN = '#1DB954'

export function SpotifyConfetti({ show, isSpotifyTheme }: SpotifyConfettiProps) {
  useEffect(() => {
    if (show) {
      // Simple Spotify-themed confetti burst
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: [SPOTIFY_GREEN, '#1ed760', '#21e065'],
      })
    }
  }, [show])

  if (!show) return null

  return (
    <div className="fixed inset-0 pointer-events-none z-[9999] flex items-center justify-center">
      <div 
        className="bg-black/80 text-white px-8 py-4 rounded-lg text-xl font-medium shadow-2xl backdrop-blur-sm border"
        style={{ 
          borderColor: SPOTIFY_GREEN,
          animation: 'celebrationPulse 0.6s ease-out'
        }}
      >
        <div className="flex items-center gap-3">
          <span style={{ color: SPOTIFY_GREEN, fontSize: '24px' }}>♪</span>
          <span>
            {isSpotifyTheme 
              ? 'Spotify theme activated! 🎧 Type \'spotify\' again to switch back'
              : 'Thanks for being a part of Ebb!'
            }
          </span>
          <span style={{ color: SPOTIFY_GREEN, fontSize: '24px' }}>♪</span>
        </div>
      </div>
      
      <style>{`
        @keyframes celebrationPulse {
          0% { transform: scale(0.8); }
          50% { transform: scale(1.1); }
          100% { transform: scale(1); }
        }
      `}</style>
    </div>
  )
}

import { useEffect, useState, useRef } from 'react'

interface NotificationProps {
  duration?: number
  soundUrl?: string
  title?: string
  onDismiss?: () => void
}

export const Notification = ({
  duration = 100000,
  soundUrl,
  title = 'Smart Session Start',
  onDismiss
}: NotificationProps) => {
  const [isVisible, setIsVisible] = useState(true)
  const [isExiting, setIsExiting] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    // Play sound if provided
    if (soundUrl) {
      audioRef.current = new Audio(soundUrl)
      audioRef.current.addEventListener('canplaythrough', () => {
        audioRef.current?.play()
      })
    }

    // Auto-dismiss after duration
    const timer = setTimeout(() => {
      handleExit()
    }, duration)

    return () => {
      clearTimeout(timer)
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current = null
      }
    }
  }, [duration, soundUrl])

  const handleExit = () => {
    setIsExiting(true)
    // Wait for exit animation to complete before calling onDismiss
    setTimeout(() => {
      onDismiss?.()
      setIsVisible(false)
    }, 500)
  }

  if (!isVisible) return null

  const notificationStyles: React.CSSProperties = {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    padding: '16px',
    gap: '12px',
    background: 'hsl(224 71.4% 4.1% / 0.95)',
    boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)',
    margin: 0,
    borderRadius: '8px',
    animation: isExiting 
      ? 'slideOut 0.5s ease-in forwards' 
      : 'slideIn 0.3s ease-out forwards',
    animationFillMode: 'forwards'
  }

  const progressBarStyles: React.CSSProperties = {
    content: '""',
    position: 'absolute',
    bottom: 0,
    left: '4px',
    right: '4px',
    height: '2px',
    width: 'calc(100% - 8px)',
    backgroundColor: '#7C3AED',
    transformOrigin: 'left',
    animation: `progress ${duration}ms linear forwards`
  }

  const iconStyles: React.CSSProperties = {
    width: '24px',
    height: '24px',
    color: '#7C3AED'
  }

  const contentStyles: React.CSSProperties = {
    flex: 1
  }

  const titleStyles: React.CSSProperties = {
    color: '#f5f3ff',
    fontWeight: 600,
    margin: 0,
    fontSize: '16px'
  }

  const dismissButtonStyles: React.CSSProperties = {
    position: 'absolute',
    top: '-8px',
    left: '-8px',
    width: '20px',
    height: '20px',
    borderRadius: '50%',
    background: 'hsl(224 71.4% 4.1% / 0.95)',
    border: 'none',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#9ca3af',
    padding: 0,
    zIndex: 10,
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
  }

  return (
    <>
      <style>
        {`
          * {
            border: none !important;
            outline: none !important;
          }
          
          html, body {
            border: none !important;
            outline: none !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          
          @keyframes progress {
            from {
              transform: scaleX(1);
            }
            to {
              transform: scaleX(0);
            }
          }

          @keyframes slideIn {
            from {
              opacity: 0;
              transform: translateY(-20px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }

          @keyframes slideOut {
            from {
              opacity: 1;
              transform: translateY(0);
            }
            to {
              opacity: 0;
              transform: translateY(-20px);
            }
          }

          .notification-container:hover .dismiss-button {
            display: flex !important;
          }

          .dismiss-button:hover {
            background: hsl(224 71.4% 8% / 0.95) !important;
            color: #f5f3ff !important;
          }
        `}
      </style>
      <div 
        className="notification-container"
        style={{
          margin: 0,
          fontFamily: 'system-ui, -apple-system, sans-serif',
          minHeight: '100vh',
          boxSizing: 'border-box'
        }}
      >
        <div style={notificationStyles}>
          <svg 
            style={iconStyles} 
            xmlns="http://www.w3.org/2000/svg" 
            fill="none" 
            viewBox="0 0 24 24" 
            strokeWidth="2" 
            stroke="currentColor"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" 
            />
          </svg>
          <div style={contentStyles}>
            <h3 style={titleStyles}>{title}</h3>
          </div>
          <button 
            className="dismiss-button"
            style={{
              ...dismissButtonStyles,
              display: 'none'
            }}
            onClick={handleExit}
          >
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              width="12" 
              height="12" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth="2" 
                d="M6 18L18 6M6 6l12 12" 
              />
            </svg>
          </button>
          <div style={progressBarStyles} />
        </div>
      </div>
    </>
  )
}

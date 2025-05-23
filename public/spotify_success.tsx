// *This is a reference file. The actual file is hosted on Framer website

import type { ComponentType } from 'react'
import * as React from 'react'

interface ButtonStyle extends React.CSSProperties {
  backgroundColor: string
  border: string
}

type ComponentWithProps = React.ComponentType<{
  children?: React.ReactNode
  style?: React.CSSProperties
}>

export function withSpotifySuccess(Component: ComponentWithProps): ComponentType {
    return (props) => {

        const openApp = React.useCallback(() => {
            const searchParams = window.location.search
            const deepLinkUrl = `ebb://spotify/callback${searchParams}`
            window.location.href = deepLinkUrl
        }, [])

        React.useEffect(() => {
            // Try to open automatically on page load
            openApp()
        }, [openApp])

        return (
            <Component
                {...props}
                style={{
                    width: '100vw',
                    height: '100vh',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: '#030712'
                }}
            >
                <div
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '16px',
                        fontFamily: 'Inter, system-ui, sans-serif',
                        color: '#fff',
                        textAlign: 'center',
                        padding: '24px'
                    }}
                >
                    <h1 style={{ 
                        fontSize: '24px', 
                        margin: 0,
                        fontWeight: 600 
                    }}>
                        Return to App
                    </h1>
                    <p style={{ 
                        fontSize: '16px',
                        margin: 0,
                        opacity: 0.8 
                    }}>
                        Click 'Open App' to finish connecting Spotify
                    </p>
                    <button
                        onClick={openApp}
                        style={{
                            backgroundColor: 'transparent',
                            color: '#fff',
                            border: '1px solid rgba(255, 255, 255, 0.2)',
                            padding: '12px 24px',
                            borderRadius: '8px',
                            fontSize: '16px',
                            fontWeight: 500,
                            cursor: 'pointer',
                            marginTop: '8px',
                            transition: 'all 0.2s ease',
                        } satisfies ButtonStyle}
                        onMouseEnter={(e: React.MouseEvent<HTMLButtonElement>) => {
                            const target = e.currentTarget
                            target.style.backgroundColor = 'rgba(255, 255, 255, 0.1)'
                            target.style.border = '1px solid rgba(255, 255, 255, 0.3)'
                        }}
                        onMouseLeave={(e: React.MouseEvent<HTMLButtonElement>) => {
                            const target = e.currentTarget
                            target.style.backgroundColor = 'transparent'
                            target.style.border = '1px solid rgba(255, 255, 255, 0.2)'
                        }}
                    >
                        Open App
                    </button>
                    <p style={{ 
                        fontSize: '14px',
                        margin: '16px 0 0 0',
                        opacity: 0.5 
                    }}>
                        You can close this window after authentication
                    </p>
                </div>
            </Component>
        )
    }
} 

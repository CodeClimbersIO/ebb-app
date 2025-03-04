// *This is a reference file. The actual file is hosted on Framer website

import type { ComponentType } from 'react'
import * as React from 'react'

const messages = [
    {
        title: 'Don\'t stop',
        description: '"I don’t stop when I’m tired, I stop when I’m done." - David Goggins'
    },
    {
        title: 'Be a focused fool',
        description: '"A focused fool can accomplish more than a distracted genius." - Alex Hormozi'
    },
    {
        title: 'A Message from Steve',
        description: '"Your time is limited. Don\'t waste it living someone else\'s life." - Steve Jobs'
    },
    {
        title: 'Stay focused, my friend 🫡',
        description: '"Your most valuable asset - your attention." - Alex Hormozi'
    },
    {
        title: 'Seize the day',
        description: '"Carpe diem. Seize the day, boys. Make your lives extraordinary." - Dead Poets Society'
    },
    {
        title: 'Persevere',
        description: '"It does not matter how slowly you go as long as you do not stop." - Confucius'
    },
    {
        title: 'Don\'t give up',
        description: '"Never give up, for that is just the place and time that the tide will turn." - Harriet Beecher Stowe'
    },
    {
        title: 'Keep going',
        description: '"Don’t watch the clock; do what it does. Keep going." - Sam Levenson'
    },
    {
        title: 'Fight, warrior',
        description: '"The successful warrior is the average man, with laser-like focus." - Bruce Lee'
    },
    {
        title: 'Make the right decision',
        description: '“I am not a product of my circumstances. I am a product of my decisions.” - Stephen R. Covey'
    }
]

export function withBlockedPage(Component): ComponentType {
    return (props) => {
        const [cmdPressed, setCmdPressed] = React.useState(false)
        const [ePressed, setEPressed] = React.useState(false)
        const [randomMessage] = React.useState(() => 
            messages[Math.floor(Math.random() * messages.length)]
        )

        React.useEffect(() => {
            const handleKeyDown = (e: KeyboardEvent) => {
                if (e.key === 'Meta' || e.key === 'Control') {
                    setCmdPressed(true)
                } else if (e.key.toLowerCase() === 'e') {
                    setEPressed(true)
                }
            }

            const handleKeyUp = (e: KeyboardEvent) => {
                if (e.key === 'Meta' || e.key === 'Control') {
                    setCmdPressed(false)
                } else if (e.key.toLowerCase() === 'e') {
                    setEPressed(false)
                }
            }

            window.addEventListener('keydown', handleKeyDown)
            window.addEventListener('keyup', handleKeyUp)

            return () => {
                window.removeEventListener('keydown', handleKeyDown)
                window.removeEventListener('keyup', handleKeyUp)
            }
        }, [])

        return (
            <Component
                {...props}
                style={{
                    width: '100vw',
                    height: '100vh',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: '#030712',
                }}
            >
                <div
                    key="container"
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '24px',
                        fontFamily: 'Inter, system-ui, sans-serif',
                        color: '#fff',
                        textAlign: 'center',
                        padding: '32px',
                        maxWidth: '600px',
                    }}
                >
                    <div
                        style={{
                            fontFamily: 'Pacifico, cursive',
                            fontSize: '48px',
                            color: 'rgb(237 233 254)', // text-violet-100
                        }}
                    >
                        ebb
                    </div>
                    <h1
                        key="title"
                        style={{
                            fontSize: '32px',
                            margin: 0,
                            fontWeight: 700,
                        }}
                    >
                        {randomMessage.title}
                    </h1>
                    <p
                        key="description"
                        style={{
                            fontSize: '18px',
                            margin: 0,
                            opacity: 0.8,
                            lineHeight: 1.6,
                            marginBottom: '32px',
                        }}
                    >
                        {randomMessage.description}
                    </p>
                    <div
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: '12px',
                            background: 'rgba(255, 255, 255, 0.05)',
                            backdropFilter: 'blur(8px)',
                            padding: '24px',
                            borderRadius: '12px',
                            minWidth: '300px',
                        }}
                    >
                        <div
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '12px',
                            }}
                        >
                            <kbd
                                style={{
                                    padding: '12px 20px',
                                    fontSize: '20px',
                                    fontWeight: 'bold',
                                    background: '#030712',
                                    border: '2px solid rgba(255, 255, 255, 0.1)',
                                    borderRadius: '8px',
                                    transition: 'all 0.2s ease',
                                    ...(cmdPressed && {
                                        background: 'rgb(124 58 237)',
                                        borderColor: 'rgb(124 58 237)',
                                    }),
                                }}
                            >⌘</kbd>
                            <span style={{ fontSize: '24px', opacity: 0.6 }}>+</span>
                            <kbd
                                style={{
                                    padding: '12px 20px',
                                    fontSize: '20px',
                                    fontWeight: 'bold',
                                    background: '#030712',
                                    border: '2px solid rgba(255, 255, 255, 0.1)',
                                    borderRadius: '8px',
                                    transition: 'all 0.2s ease',
                                    ...(ePressed && {
                                        background: 'rgb(124 58 237)',
                                        borderColor: 'rgb(124 58 237)',
                                    }),
                                }}
                            >E</kbd>
                        </div>
                        <p
                            style={{
                                fontSize: '14px',
                                opacity: 0.6,
                                margin: 0,
                            }}
                        >
                            to access your session
                        </p>
                    </div>
                </div>
            </Component>
        )
    }
}

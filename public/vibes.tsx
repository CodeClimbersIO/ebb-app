// *This is a reference file. The actual file is hosted on Framer website

import type { ComponentType } from 'react'
import * as React from 'react'

const messages = [
    {
        description: '"I don\'t stop when I\'m tired, I stop when I\'m done."',
        author: 'David Goggins'
    },
    {
        description: '"A focused fool can accomplish more than a distracted genius."',
        author: 'Alex Hormozi'
    },
    {
        description: '"Your time is limited. Don\'t waste it living someone else\'s life."',
        author: 'Steve Jobs'
    },
    {
        description: '"Your most valuable asset - your attention."',
        author: 'Alex Hormozi'
    },
    {
        description: '"Carpe diem. Seize the day, boys. Make your lives extraordinary."',
        author: 'Dead Poets Society'
    },
    {
        description: '"It does not matter how slowly you go as long as you do not stop."',
        author: 'Confucius'
    },
    {
        description: '"Never give up, for that is just the place and time that the tide will turn."',
        author: 'Harriet Beecher Stowe'
    },
    {
        description: '"Don\'t watch the clock; do what it does. Keep going."',
        author: 'Sam Levenson'
    },
    {
        description: '"The successful warrior is the average man, with laser-like focus."',
        author: 'Bruce Lee'
    },
    {
        description: '"I am not a product of my circumstances. I am a product of my decisions."',
        author: 'Stephen R. Covey'
    },
    {
        description: '"Concentrate all your thoughts upon the work at hand. The sun\'s rays do not burn until brought to a focus."',
        author: 'Alexander Graham Bell'
    },
    {
        description: '"The main thing is to keep the main thing the main thing."',
        author: 'Stephen Covey'
    },
    {
        description: '"Where focus goes, energy flows."',
        author: 'Tony Robbins'
    },
    {
        description: '"The difference between successful people and very successful people is that very successful people say no to almost everything."',
        author: 'Warren Buffett'
    },
    {
        description: '"It is during our darkest moments that we must focus to see the light."',
        author: 'Aristotle'
    },
    {
        description: '"Focus is a force multiplier on work."',
        author: 'Sam Altman'
    },
    {
        description: '"People spend too much time doing and not enough time thinking about what they should be doing."',
        author: 'Naval Ravikant'
    }
]

export function withBlockedPage(Component): ComponentType {
    return (props) => {
        const [randomMessage] = React.useState(() => 
            messages[Math.floor(Math.random() * messages.length)]
        )

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
                            fontSize: '40px',
                            color: 'rgb(237 233 254)',
                            marginBottom: '24px'
                        }}
                    >
                        ebb
                    </div>
                    <div
                        style={{
                            width: '120px',
                            height: '1px',
                            backgroundColor: 'rgba(255, 255, 255, 0.2)',
                            marginBottom: '32px'
                        }}
                    />
                    <p
                        key="description"
                        style={{
                            fontSize: '18px',
                            margin: 0,
                            opacity: 0.9,
                            lineHeight: 1.6,
                            marginBottom: '8px',
                            fontStyle: 'italic'
                        }}
                    >
                        {randomMessage.description}
                    </p>
                    <p
                        style={{
                            fontSize: '16px',
                            margin: 0,
                            opacity: 0.7,
                            fontWeight: 500
                        }}
                    >
                        — {randomMessage.author}
                    </p>
                </div>
            </Component>
        )
    }
}

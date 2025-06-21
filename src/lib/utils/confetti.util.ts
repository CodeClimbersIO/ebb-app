import confetti from 'canvas-confetti'

// Confetti presets for different celebrations
export const confettiPresets = {
  // Friend request accepted celebration
  friendAccepted: () => {
    const colors = ['#7C3AED', '#10B981', '#F59E0B', '#EF4444', '#3B82F6']
    confetti({
      particleCount: 100,       
      spread: 360,             
      origin: { y: 0.6 },      
      colors
    })
  },

  // Success celebration
  success: () => {
    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.7 },
      colors: ['#10B981', '#34D399', '#6EE7B7']
    })
  },

  // Achievement unlocked
  achievement: () => {
    const colors = ['#7C3AED', '#A855F7', '#C084FC']
    
    // Multiple bursts
    confetti({
      particleCount: 50,
      spread: 50,
      origin: { x: 0.25, y: 0.6 },
      colors
    })
    
    setTimeout(() => {
      confetti({
        particleCount: 50,
        spread: 50,
        origin: { x: 0.75, y: 0.6 },
        colors
      })
    }, 250)
  },

  // Session completed
  sessionComplete: () => {
    const colors = ['#F59E0B', '#FBBF24', '#FCD34D']
    
    confetti({
      particleCount: 75,
      spread: 80,
      origin: { y: 0.5 },
      colors,
      shapes: ['star']
    })
  },

  // Custom confetti with options
  custom: (options: confetti.Options) => {
    confetti(options)
  }
}

// Main confetti function for easy usage
export const triggerConfetti = (preset: keyof typeof confettiPresets, customOptions?: confetti.Options) => {
  if (preset === 'custom' && customOptions) {
    confettiPresets.custom(customOptions)
  } else if (preset !== 'custom') {
    confettiPresets[preset]()
  }
}

export default triggerConfetti 

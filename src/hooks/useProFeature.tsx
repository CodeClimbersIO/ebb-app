import { useState } from 'react'
import { useLicense } from '@/contexts/LicenseContext'
import { PaywallDialog } from '@/components/PaywallDialog'

interface UseProFeatureOptions {
  onUnauthorized?: () => void
}

export function useProFeature(options: UseProFeatureOptions = {}) {
  const { license, isLoading } = useLicense()
  const [showPaywall, setShowPaywall] = useState(false)

  // Check if user has access to pro features
  const hasAccess = !isLoading && license !== null

  // Function to be called when trying to use a pro feature
  const requirePro = <T extends (...args: unknown[]) => unknown>(callback: T) => {
    return (...args: Parameters<T>) => {
      if (hasAccess) {
        return callback(...args)
      } else {
        setShowPaywall(true)
        options.onUnauthorized?.()
        return
      }
    }
  }

  // Hook to wrap a component that requires pro
  const ProOnly = ({ children }: { children: React.ReactNode }) => {
    if (hasAccess) {
      return <>{children}</>
    }

    return (
      <div onClick={() => setShowPaywall(true)}>
        <PaywallDialog>
          {children}
        </PaywallDialog>
      </div>
    )
  }

  // For conditional rendering of pro features
  const ifPro = (element: React.ReactNode) => {
    if (hasAccess) {
      return element
    }
    return null
  }

  return {
    hasAccess,
    isLoading,
    requirePro,
    ProOnly,
    ifPro,
    showPaywall,
    setShowPaywall,
  }
}

// Example usage:
/*
// 1. Protect a button/interaction:
const { requirePro, ProOnly } = useProFeature()

// Method 1: Wrap the click handler
<Button onClick={requirePro(() => handleAllowList())}>
  Configure Allow List
</Button>

// Method 2: Wrap the entire component
<ProOnly>
  <Button onClick={handleAllowList}>
    Configure Allow List
  </Button>
</ProOnly>

// 2. Conditional rendering:
const { ifPro } = useProFeature()

return (
  <div>
    {ifPro(
      <div>This content is only visible to pro users</div>
    )}
  </div>
)
*/ 

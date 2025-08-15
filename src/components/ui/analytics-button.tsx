import * as React from 'react'
import { Button, type ButtonProps } from './button'
import { AnalyticsService, type AnalyticsEvent, type AnalyticsEventProperties } from '@/lib/analytics'

export interface AnalyticsButtonProps extends ButtonProps {
  analyticsEvent: AnalyticsEvent
  analyticsProperties?: AnalyticsEventProperties
}

const AnalyticsButton = React.forwardRef<HTMLButtonElement, AnalyticsButtonProps>(
  ({ analyticsEvent, analyticsProperties, onClick, ...props }, ref) => {
    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      // Track the analytics event
      AnalyticsService.trackEvent(analyticsEvent, analyticsProperties)
      
      // Call the original onClick handler
      if (onClick) {
        onClick(e)
      }
    }

    return (
      <Button
        ref={ref}
        onClick={handleClick}
        {...props}
      />
    )
  },
)
AnalyticsButton.displayName = 'AnalyticsButton'

export { AnalyticsButton }

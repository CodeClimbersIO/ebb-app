import * as React from 'react'
import { Button, type ButtonProps } from './button'



const NoAnalyticsButton = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ ...props }, ref) => {

    return (
      <Button
        ref={ref}
        {...props}
      />
    )
  },
)
NoAnalyticsButton.displayName = 'NoAnalyticsButton'

export { NoAnalyticsButton }

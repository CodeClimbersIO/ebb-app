import * as React from "react"
import * as SliderPrimitive from "@radix-ui/react-slider"

import { cn } from "@/lib/tailwind.util"

const Slider = React.forwardRef<
  React.ElementRef<typeof SliderPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root> & {
    trackColor?: string;
    rangeColor?: string;
    thumbBorderColor?: string;
  }
>(({ className, trackColor, rangeColor, thumbBorderColor, ...props }, ref) => (
  <SliderPrimitive.Root
    ref={ref}
    className={cn(
      "relative flex w-full touch-none select-none items-center",
      className
    )}
    {...props}
  >
    <SliderPrimitive.Track 
      className={cn(
        "relative h-1.5 w-full grow overflow-hidden rounded-full",
        trackColor || "bg-primary/20"
      )}
    >
      <SliderPrimitive.Range 
        className={cn(
          "absolute h-full",
          rangeColor || "bg-primary"
        )}
      />
    </SliderPrimitive.Track>
    <SliderPrimitive.Thumb 
      className={cn(
        "block h-4 w-4 rounded-full border-2 bg-background shadow transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50",
        thumbBorderColor || "border-primary"
      )}
    />
  </SliderPrimitive.Root>
))
Slider.displayName = SliderPrimitive.Root.displayName

export { Slider }

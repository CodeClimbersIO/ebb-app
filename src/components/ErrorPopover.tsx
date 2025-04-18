import { useState, useEffect } from 'react'
import { useErrorStore } from '@/lib/stores/errorStore'
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { AlertTriangle, Copy, Check } from 'lucide-react'

export function ErrorPopover() {
  const { error, clearError } = useErrorStore()
  const [popoverOpen, setPopoverOpen] = useState(!!error) // Initialize based on error
  const [isCopied, setIsCopied] = useState(false)

  // Effect to open popover when a new error arrives
  useEffect(() => {
    if (error) {
      setPopoverOpen(true)
      setIsCopied(false) // Reset copy status on new error
    }
    // We don't setPopoverOpen(false) here anymore
  }, [error])

  const handleCopyError = async () => {
    if (error && !isCopied) {
      try {
        await navigator.clipboard.writeText(error)
        setIsCopied(true)
      } catch (err) {
        console.error('Failed to copy text: ', err)
      }
    }
  }

  const handleOpenChange = (open: boolean) => {
    setPopoverOpen(open)
    if (open) {
      setIsCopied(false) // Reset copy status when popover opens
    } else {
      // Only clear the error when the user explicitly closes the popover
      clearError()
    }
  }

  if (!error && !popoverOpen) {
    // Render nothing if there is no error AND the popover has been closed
    return null 
  }

  // We still need to show the trigger even if error is null briefly 
  // while the popover closing animation runs, controlled by popoverOpen
  return (
    <Popover open={popoverOpen} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon">
          <AlertTriangle className="h-5 w-5 text-destructive" />
        </Button>
      </PopoverTrigger>
      {/* Only render content if there is actually an error */} 
      {error && (
        <PopoverContent className="w-80" align="end">
          <div className="grid gap-4">
            <div className="space-y-2">
              <h4 className="font-medium leading-none">Application Error</h4>
            </div>
            <div className="space-y-2">
              <pre className="text-xs bg-muted p-3 rounded overflow-auto max-h-60 font-mono w-full whitespace-pre-wrap break-words">{error}</pre>
              <Button 
                size="sm" 
                variant="outline" 
                onClick={handleCopyError} 
                className="w-full"
                disabled={isCopied}
              >
                {isCopied ? (
                  <Check className="mr-2 h-4 w-4 text-green-600" />
                ) : (
                  <Copy className="mr-2 h-4 w-4"/> 
                )}
                {isCopied ? 'Copied!' : 'Copy Error Details'}
              </Button>
            </div>
          </div>
        </PopoverContent>
       )} 
    </Popover>
  )
} 

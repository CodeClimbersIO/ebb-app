import { Toaster as Sonner, toast } from 'sonner'
import { useState } from 'react'
import { Clipboard, Check } from 'lucide-react'

type ToasterProps = React.ComponentProps<typeof Sonner>

function ErrorToastContent({ errorMessage }: { errorMessage: string }) {
  const [isCopied, setIsCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(errorMessage).then(() => {
      setIsCopied(true)
    })
  }

  return (
    <div className="flex items-center justify-between w-full gap-2">
      <span className="text-red-400">{errorMessage}</span>
      <button 
        onClick={handleCopy} 
        className='shrink-0 p-1.5 rounded-md text-red-400 hover:bg-red-800/30 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-red-800 disabled:opacity-50 transition-colors'
        disabled={isCopied}
      >
        {isCopied ? <Check size={14} className="text-green-300" /> : <Clipboard size={14} />}
      </button>
    </div>
  )
}

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      className='toaster group z-[100]'
      toastOptions={{
        classNames: {
          toast:
            'group toast group-[.toaster]:bg-red-950 group-[.toaster]:text-red-400 group-[.toaster]:border-red-900 group-[.toaster]:shadow-lg',
          description: 'group-[.toast]:text-red-400',
          actionButton:
            'inline-flex items-center justify-center whitespace-nowrap rounded-md text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 group-[.toast]:bg-secondary group-[.toast]:text-secondary-foreground group-[.toast]:shadow-sm group-[.toast]:hover:bg-secondary/80 h-8 px-3',
          cancelButton:
            'group-[.toast]:bg-muted group-[.toast]:text-muted-foreground',
        },
      }}
      {...props}
    />
  )
}

const toastError = (errorMessage: string) => {
  toast(<ErrorToastContent errorMessage={errorMessage} />, {
  })
}

export { Toaster, toastError }

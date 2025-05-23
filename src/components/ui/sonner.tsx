import { Toaster as Sonner, toast } from 'sonner'
import { LifeBuoy } from 'lucide-react'
import { toastStore } from '../../lib/stores/toastStore'

type ToasterProps = React.ComponentProps<typeof Sonner>

function ErrorToastContent({ error }: { error: Error }) {
  const handleSupport = () => {
    toastStore.setState({ error })
  }
  return (
    <div className="flex w-full gap-2 items-start">
      <div className="text-red-400 flex-1 min-w-0 break-words">
        {error.message}
      </div>
      <div className="flex gap-1 shrink-0 ml-2">
        <button
          onClick={handleSupport}
          className="shrink-0 p-1.5 rounded-md text-red-400 hover:bg-red-800/30 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-red-800 transition-colors flex items-center gap-1"
        >
          <LifeBuoy size={14} />
          <span className="text-xs">Contact Support</span>
        </button>
      </div>
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

const toastError = (error: Error) => {
  toast(<ErrorToastContent error={error} />, {
    duration: 8000,
  })
}

export { Toaster, toastError }

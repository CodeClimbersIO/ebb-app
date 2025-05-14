import { error as tauriErrorLogger } from '@tauri-apps/plugin-log'
import { toastError } from '@/components/ui/sonner'

export const logAndToastError = (errorMessage: string, error: unknown) => {

  tauriErrorLogger(errorMessage)
  if(error instanceof Error) {
    toastError(error)
  } else {
    toastError(new Error(errorMessage))
  }
  if (error instanceof Error) {
    tauriErrorLogger(error.message)
  }
}

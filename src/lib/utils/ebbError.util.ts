import { error as tauriErrorLogger } from '@tauri-apps/plugin-log'
import { toastError } from '@/components/ui/sonner'

export const logAndToastError = (errorMessage: string, error: unknown) => {
  tauriErrorLogger(errorMessage)
  if(isError(error)) {
    toastError(error)
    tauriErrorLogger(error.message)
  } else {
    toastError(new Error(errorMessage))
  }
}

export const isError = (error: unknown): error is Error => {
  return error instanceof Error || (typeof error === 'object' && error !== null && 'message' in error)
}

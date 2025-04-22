import { error as tauriErrorLogger } from '@tauri-apps/plugin-log'
import { toastError } from '@/components/ui/sonner'

export const logAndToastError = (errorMessage: string) => {
  tauriErrorLogger(errorMessage)
  toastError(errorMessage)
}

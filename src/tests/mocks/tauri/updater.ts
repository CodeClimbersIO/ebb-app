type UpdateInfo = {
  version: string
  date: string
  body: string
  downloadAndInstall: (cb: (ev: any) => void) => Promise<void>
}

export const check = async (): Promise<UpdateInfo | null> => {
  return null
}


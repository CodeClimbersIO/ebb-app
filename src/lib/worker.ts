/**
 * takes a function and will accept the first request and ignore all subsequent requests with the same id
 */
const running = new Map<string, boolean>()

export const work = async (id: string, fn: ()=>Promise<void>): Promise<void> => {
  if(running.get(id)) return
  running.set(id, true)
  await fn()
}

export const Worker = {
  work
}

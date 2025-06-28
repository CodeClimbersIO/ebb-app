import { describe, expect, it, vi } from 'vitest'
import { EbbWorker } from '../ebbWorker'

describe('worker', ()=>{  
  describe('work', ()=>{
    it('should only run the first request', async ()=>{
      const fn = vi.fn()
      await EbbWorker.work('1', fn)
      await EbbWorker.work('1', fn)
      
      expect(fn).toHaveBeenCalledTimes(1)
      expect(fn).toHaveBeenCalledWith()
    })
  })

  describe('debounceWork', ()=>{
    it('should only run the function once', async ()=>{
      const fn = vi.fn()
      await EbbWorker.debounceWork(fn)
      await EbbWorker.debounceWork(fn)
      await EbbWorker.debounceWork(fn)
      await EbbWorker.debounceWork(fn)
      expect(fn).toHaveBeenCalledTimes(1)
    })
    it('should only run the function once with a different id', async ()=>{
      const fn = vi.fn()
      await EbbWorker.debounceWork(fn, '1')
      await EbbWorker.debounceWork(fn, '1')
      await EbbWorker.debounceWork(fn, '2')
      await EbbWorker.debounceWork(fn, '2')
      await EbbWorker.debounceWork(fn, '2')
      expect(fn).toHaveBeenCalledTimes(2)
    })
  })
})

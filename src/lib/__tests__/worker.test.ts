import { describe, expect, it, vi } from 'vitest'
import { Worker } from '../worker'

describe('worker', ()=>{  
  describe('work', ()=>{
    it('should only run the first request', async ()=>{
      const fn = vi.fn()
      await Worker.work('1', fn)
      await Worker.work('1', fn)
      await Worker.work('1', fn)
      
      expect(fn).toHaveBeenCalledTimes(1)
      expect(fn).toHaveBeenCalledWith()
    })
  })
})

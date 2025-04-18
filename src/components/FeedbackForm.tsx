import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form'
import { Textarea } from './ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'

const RATE_LIMIT = {
  MAX_SUBMISSIONS: 5,
  WINDOW_MINUTES: 5
}

const formSchema = z.object({
  feedback: z.string().min(10, {
    message: 'Must be at least 10 characters'
  })
})

interface FeedbackFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function FeedbackForm({ open, onOpenChange }: FeedbackFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [remainingSubmissions, setRemainingSubmissions] = useState(RATE_LIMIT.MAX_SUBMISSIONS)
  const { user } = useAuth()
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      feedback: ''
    }
  })

  useEffect(() => {
    updateRemainingSubmissions()
    const interval = setInterval(updateRemainingSubmissions, 30000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (!open) {
      setSubmitStatus('idle')
    }
  }, [open])

  function updateRemainingSubmissions() {
    const submissions = JSON.parse(localStorage.getItem('feedbackSubmissions') || '[]') as number[]
    const now = Date.now()
    const windowMs = RATE_LIMIT.WINDOW_MINUTES * 60 * 1000
    
    const recentSubmissions = submissions.filter(timestamp => now - timestamp < windowMs)
    localStorage.setItem('feedbackSubmissions', JSON.stringify(recentSubmissions))
    
    setRemainingSubmissions(Math.max(0, RATE_LIMIT.MAX_SUBMISSIONS - recentSubmissions.length))
  }

  function addSubmissionTimestamp() {
    const submissions = JSON.parse(localStorage.getItem('feedbackSubmissions') || '[]') as number[]
    submissions.push(Date.now())
    localStorage.setItem('feedbackSubmissions', JSON.stringify(submissions))
    updateRemainingSubmissions()
  }

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (remainingSubmissions <= 0) {
      setSubmitStatus('error')
      return
    }

    try {
      setIsSubmitting(true)
      setSubmitStatus('idle')
      
      const payload = {
        feedback: values.feedback,
        email: user?.email || 'anonymous',
        timestamp: new Date().toISOString()
      }
      
      await fetch('https://script.google.com/macros/s/AKfycbxEbN-ZWp9I1LzQFkFizrF0cSABPacBREfqjCHEWkWwHyJa4oZM78_Hj0092TlFG4mEew/exec', {
        method: 'POST',
        mode: 'no-cors',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      })

      addSubmissionTimestamp()
      setSubmitStatus('success')
      form.reset()
    } catch (error) {
      console.error('Error submitting feedback:', error)
      setSubmitStatus('error')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Submit Feedback</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="feedback"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="sr-only">Insert your Feedback/Bugs</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Share your feedback or report a bug..."
                      className="min-h-[100px] resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="space-y-2">
              <Button 
                type="submit" 
                className="w-full" 
                disabled={isSubmitting || remainingSubmissions <= 0}
              >
                {isSubmitting ? 'Submitting...' : remainingSubmissions <= 0 ? 'Rate limit reached' : 'Submit Feedback'}
              </Button>
              {submitStatus === 'error' && remainingSubmissions <= 0 && (
                <p className="text-sm text-destructive text-center">
                  Please try again in a few minutes
                </p>
              )}
              {submitStatus === 'error' && remainingSubmissions > 0 && (
                <p className="text-sm text-destructive text-center">
                  Failed to submit. Please try again
                </p>
              )}
              {submitStatus === 'success' && (
                <p className="text-sm text-green-600 text-center">Thank you for your feedback!</p>
              )}
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
} 

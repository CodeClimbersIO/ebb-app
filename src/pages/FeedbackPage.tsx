import { useEffect, useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Layout } from '@/components/Layout'
import { CommunityCard } from '@/components/CommunityCard'
import { FAQ } from '@/components/FAQ'
import supabase from '@/lib/integrations/supabase'
import { logAndToastError } from '@/lib/utils/ebbError.util'
import { useAuth } from '@/hooks/useAuth'
import { Input } from '@/components/ui/input'
import { toastStore } from '@/lib/stores/toastStore'

export default function FeedbackPage() {
  const { user } = useAuth()
  const [feedback, setFeedback] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [email, setEmail] = useState(user?.email || '')
  const [submitted, setSubmitted] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement | null>(null)

  useEffect(() => {
    if (user) {
      setEmail(user.email || '')
    }
  }, [user])

  useEffect(() => {
    const error = toastStore.getState().error
    if (error) {
      const prefillText = `${JSON.stringify(error)}\n\n---\nSorry about that! We want to help you. Please describe what you were doing when this error occurred:`
      setFeedback(prefillText)
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.selectionStart = textareaRef.current.selectionEnd = prefillText.length
          textareaRef.current.focus()
        }
      }, 0)
      toastStore.setState({ error: null })
    }
  }, [])

  useEffect(() => {
    const textarea = textareaRef.current
    if (textarea) {
      textarea.style.height = 'auto'
      textarea.style.height = textarea.scrollHeight + 'px'
    }
  }, [feedback])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const res = await supabase.functions.invoke('submit-feedback', {
        method: 'POST',
        body: { message: feedback, user: email },
      })
      if (res.error) {
        throw res.error
      }
      setSubmitted(true)
    } catch (error) {
      logAndToastError(`Error submitting feedback: ${error}`, error)
    } finally {
      setTimeout(() => {
        setSubmitting(false)
        setFeedback('')
      }, 1200)
    }
  }

  return (
    <Layout>
      <div className="p-8">
        <div className="max-w-2xl mx-auto space-y-8">
          <h1 className="text-2xl font-semibold mb-4">Feedback</h1>
          <Card className="p-6 mb-8">
            {submitted ? (
              <div className="text-center text-lg py-8">
                Thank you for submitting your feedback!<br />
                <span className="text-muted-foreground">paul@ebb.cool should be getting back to you within the hour.</span>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                  placeholder="Email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                />
                <textarea
                  ref={textareaRef}
                  className="w-full min-h-[100px] rounded border bg-background p-3 text-base"
                  placeholder="Share your feedback, bug report, or feature request..."
                  value={feedback}
                  onChange={e => setFeedback(e.target.value)}
                  required
                  disabled={submitting}
                  style={{ resize: 'none', overflow: 'hidden' }}
                />
                <div className="flex justify-end">
                  <Button type="submit" disabled={submitting || !feedback.trim()}>
                    {submitting ? 'Submitting...' : 'Submit Feedback'}
                  </Button>
                </div>
              </form>
            )}
          </Card>

          <CommunityCard />

          <FAQ />

          
        </div>
      </div>
    </Layout>
  )
} 

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Layout } from '@/components/Layout'
import { CommunityCard } from '../components/CommunityCard'
import { FAQ } from '../components/FAQ'
import supabase from '../lib/integrations/supabase'
import { logAndToastError } from '../lib/utils/logAndToastError'
import { useAuth } from '../hooks/useAuth'
import { Input } from '../components/ui/input'

export default function FeedbackPage() {
  const { user } = useAuth()
  const [feedback, setFeedback] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [email, setEmail] = useState(user?.email || '')
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => {
    if (user) {
      setEmail(user.email || '')
    }
  }, [user])

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
      logAndToastError(`Error submitting feedback: ${error}`)
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
                  className="w-full min-h-[100px] rounded border bg-background p-3 text-base"
                  placeholder="Share your feedback, bug report, or feature request..."
                  value={feedback}
                  onChange={e => setFeedback(e.target.value)}
                  required
                  disabled={submitting}
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

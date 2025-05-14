import { useState } from 'react'
import { Card } from './ui/card'
import { cn } from '../lib/utils/tailwind.util'

const FAQS = [
  {
    question: 'How does Ebb track my time?',
    answer: 'Ebb uses system APIs to monitor app and website usage locally on your device. Anytime you change focus onto a different window, Ebb records that as the new "active" window. We store that activity and categorize it using some defaults we have provided. No private data is sent to our servers. Check out the code at https://github.com/CodeClimbersIO/os-monitor'
  },
  {
    question: 'How do you measure "offline" time',
    answer: 'We have two different time buckets for "offline" that we\'ve combined into one. "idle", which is if during a 30 second interval there is no mouse, keyboard, or window change, and "offline", which is if Ebb is "off." which either means the computer is offline or the app isn\'t running'
  },
  {
    question: 'How do I change which apps are marked as consuming and which are creating?',
    answer: 'On your dashboard, under the time graph in the "App/Website Usage" section, you can modify each apps consuming & creating weight going forward'
  },
  {
    question: 'Why didn\'t the consuming and creating time update when I updated the app category?',
    answer: 'Vhanging an apps category will only mark the time with your new categorization going forward. It will not retroactively apply that to previous time periods'
  },
  {
    question: 'Why does the app need \'accesibility\' permissions?',
    answer: 'Ebb uses the built in functionality of the computer to read the window information of apps that are open to track time. In order to do this, Ebb needs the accessibility permission to read that information for the different apps that are being used.'
  },
  {
    question: 'Do you sell my data?',
    answer: 'No, part of our mission with Ebb is to build apps that give users control of their data and how it is used. As part of that, we believe selling your data would go against that principle. To help enforce this idea, we keep your sensitive data only on your device locally.'
  },
  {
    question: 'What data do you store?',
    answer: 'We do collect some data that we use to determine licensing status and for online features like friends and multi device sync.'
  },
  {
    question: 'How do I report a bug or request a feature?',
    answer: 'You can use this feedback form on this page or join our Discord community and create a message in our bugs-support channel'
  }, 
]

export const FAQ = ()=> {
  const [expanded, setExpanded] = useState<number | null>(null)

  return (
    <Card className="p-6 mb-8">
      <h2 className="text-lg font-semibold mb-4">FAQ</h2>
      <div className="space-y-2">
        {FAQS.map((faq, i) => (
          <div key={faq.question}>
            <button
              className={cn(
                'w-full text-left font-medium py-2 px-3 rounded transition-colors',
                expanded === i ? 'bg-muted' : 'hover:bg-muted/50'
              )}
              onClick={() => setExpanded(expanded === i ? null : i)}
            >
              {faq.question}
            </button>
            {expanded === i && (
              <div className="px-4 pb-3 text-muted-foreground text-sm animate-fade-in">
                {faq.answer}
              </div>
            )}
          </div>
        ))}
      </div>
    </Card>
  )
}

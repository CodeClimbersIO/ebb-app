import * as React from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { KeyRound } from 'lucide-react'
import { RainbowButton } from '@/components/ui/rainbow-button'

interface PaywallDialogProps {
  children: React.ReactNode
}

const users = [
  { name: 'Alex', image: '/avatars/01.png', initials: 'A' },
  { name: 'Ben', image: '/avatars/02.png', initials: 'B' },
  { name: 'Charlie', image: '/avatars/03.png', initials: 'C' },
  { name: 'David', image: '/avatars/04.png', initials: 'D' },
  { name: 'Emma', image: '/avatars/05.png', initials: 'E' },
]

export function PaywallDialog({ children }: PaywallDialogProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader className="space-y-2">
          <div className="flex justify-center mb-3">
            <Badge className="bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20 border-0">
              <KeyRound className="h-3 w-3 mr-1" />
              Ebb Pro
            </Badge>
          </div>
          <div className="text-center">
            <DialogTitle className="text-3xl font-bold mb-2">
              Pay once
            </DialogTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Your copy forever & one year of updates
            </p>
          </div>
        </DialogHeader>
        
        {/* Price Section */}
        <div className="text-center mt-2">
          <div className="flex items-baseline justify-center">
            <span className="text-3xl font-bold">$37</span>
            <span className="text-sm text-muted-foreground ml-2">one-time</span>
          </div>
        </div>

        {/* CTA Button */}
        <RainbowButton className="w-full mt-3">
          Get Pro License
        </RainbowButton>

        {/* Social Proof */}
        <div className="flex items-center justify-center gap-2 mt-3">
          <div className="flex -space-x-3">
            {users.map((user, index) => (
              <Avatar key={index} className="h-6 w-6 border-2 border-background">
                <AvatarImage src={user.image} alt={user.name} />
                <AvatarFallback>{user.initials}</AvatarFallback>
              </Avatar>
            ))}
          </div>
          <span className="text-xs text-muted-foreground">Join thousands of pros</span>
        </div>

        {/* Features List */}
        <div className="grid grid-cols-2 gap-2 text-sm mt-4">
          <div className="flex items-center">
            <svg className="h-4 w-4 text-primary mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span>6 focus presets</span>
          </div>
          <div className="flex items-center">
            <svg className="h-4 w-4 text-primary mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span>Hard difficulty</span>
          </div>
          <div className="flex items-center">
            <svg className="h-4 w-4 text-primary mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span>Typewriter mode</span>
          </div>
          <div className="flex items-center">
            <svg className="h-4 w-4 text-primary mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span>Allow list</span>
          </div>
          <div className="flex items-center">
            <svg className="h-4 w-4 text-primary mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span>3 macOS devices</span>
          </div>
          <div className="flex items-center">
            <svg className="h-4 w-4 text-primary mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span>1 year of updates</span>
          </div>
        </div>

        {/* Money-back guarantee */}
        <p className="text-center text-xs text-muted-foreground mt-4">
          30-day money-back guarantee
        </p>
      </DialogContent>
    </Dialog>
  )
}

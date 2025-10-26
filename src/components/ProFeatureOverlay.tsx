import { RainbowButton } from '@/components/ui/rainbow-button'
import { usePaywall } from '@/hooks/usePaywall'

interface ProFeatureOverlayProps {
  title: string
  subtitle: string
  ctaText?: string
}

export function ProFeatureOverlay({
  title,
  subtitle,
  ctaText = 'Upgrade to Pro'
}: ProFeatureOverlayProps) {
  const { openPaywall } = usePaywall()

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center backdrop-blur-sm bg-background/80">
      <div className="text-center max-w-md px-6">
        <h2 className="text-3xl font-bold mb-4">{title}</h2>
        <p className="text-muted-foreground text-lg mb-8">{subtitle}</p>
        <RainbowButton onClick={openPaywall} className="w-full max-w-xs">
          {ctaText}
        </RainbowButton>
      </div>
    </div>
  )
}

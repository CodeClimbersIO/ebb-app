interface TideCompletedBadgeProps {
  id: string
}

export const TideCompletedBadge = ({ id }: TideCompletedBadgeProps) => (
  <svg viewBox="0 0 128 128" role="img" aria-label="Tide Completed">
    <defs>
      <linearGradient id={`g-ring-${id}`} x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="hsl(var(--primary) / 0.8)" />
        <stop offset="100%" stopColor="hsl(var(--primary))" />
      </linearGradient>
      <linearGradient id={`g-wave-${id}`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="hsl(var(--primary) / 0.9)" />
        <stop offset="100%" stopColor="hsl(var(--primary))" />
      </linearGradient>
      <filter id={`glow-${id}`} x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur in="SourceGraphic" stdDeviation="2" result="blur" />
        <feMerge>
          <feMergeNode in="blur" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
    </defs>

    {/* Outer badge ring */}
    <circle cx="64" cy="64" r="56" fill="none" stroke={`url(#g-ring-${id})`} strokeWidth="8" />

    {/* Inner badge body with wave */}
    <clipPath id={`inner-${id}`}>
      <circle cx="64" cy="64" r="44" />
    </clipPath>
    <circle cx="64" cy="64" r="44" fill="hsl(var(--primary) / 0.08)" />
    <g clipPath={`url(#inner-${id})`}>
      <path
        d="M-10 78 C 5 70, 20 86, 35 78 S 65 70, 80 78 S 110 86, 130 78 L130 128 L-10 128 Z"
        fill={`url(#g-wave-${id})`}
      />
      <path
        d="M-10 70 C 5 62, 20 78, 35 70 S 65 62, 80 70 S 110 78, 130 70 L130 128 L-10 128 Z"
        fill="hsl(var(--primary) / 0.45)"
      />
    </g>

    {/* Checkmark coin */}
    <circle cx="64" cy="58" r="18" fill={`url(#g-ring-${id})`} />
    <path
      d="M56 58 l6 6 14 -14"
      fill="none"
      stroke="white"
      strokeWidth="5"
      strokeLinecap="round"
      strokeLinejoin="round"
      filter={`url(#glow-${id})`}
    />
  </svg>
)

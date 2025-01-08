import { Link } from "react-router-dom"

interface LogoProps {
  className?: string
}

export function Logo({ className = "" }: LogoProps) {
  return (
    <Link to="/" className={`font-pacifico text-3xl font-bold text-violet-600 dark:text-violet-100 ${className}`}>
      ebb
    </Link>
  )
} 
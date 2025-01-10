import { DateTime } from 'luxon'

export function assertDateTimeEqual(
  left: DateTime,
  right: DateTime,
  toleranceMs: number = 10
): void {
  const diffMs = Math.abs(left.toMillis() - right.toMillis())
  
  if (diffMs > toleranceMs) {
    throw new Error(
      `Times differ by more than ${toleranceMs}ms: left=${left.toISO()}, right=${right.toISO()}`
    )
  }
}

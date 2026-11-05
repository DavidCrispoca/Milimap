import { useState } from 'react'

/**
 * Current time, captured once per mount.
 *
 * Reading the clock during render makes output impure and hard to test. Capturing
 * it once in a state initializer keeps renders stable; screens that need a fresh
 * value remount or call their own refresh.
 */
export function useNow(): Date {
  const [now] = useState(() => new Date())
  return now
}

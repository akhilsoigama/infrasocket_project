import { useEffect, useState } from 'react'

export interface UtcTimeState {
  timeStr: string // e.g., "08:24:12"
  dateStr: string // e.g., "2026-10-12"
  isoStr: string  // ISO 8601
  timestamp: number
}

function getUtcValues(): UtcTimeState {
  const now = new Date()
  const year = now.getUTCFullYear()
  const month = String(now.getUTCMonth() + 1).padStart(2, '0')
  const day = String(now.getUTCDate()).padStart(2, '0')
  const hours = String(now.getUTCHours()).padStart(2, '0')
  const minutes = String(now.getUTCMinutes()).padStart(2, '0')
  const seconds = String(now.getUTCSeconds()).padStart(2, '0')

  return {
    timeStr: `${hours}:${minutes}:${seconds}`,
    dateStr: `${year}-${month}-${day}`,
    isoStr: now.toISOString(),
    timestamp: now.getTime(),
  }
}

export function useUtcClock(intervalMs = 1000): UtcTimeState {
  const [utcTime, setUtcTime] = useState<UtcTimeState>(getUtcValues)

  useEffect(() => {
    const timer = setInterval(() => {
      setUtcTime(getUtcValues())
    }, intervalMs)
    return () => clearInterval(timer)
  }, [intervalMs])

  return utcTime
}

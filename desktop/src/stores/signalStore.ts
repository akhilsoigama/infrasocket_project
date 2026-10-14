import { create } from 'zustand'
import type { AIStatus, SignalMetrics } from '@/types'

interface SignalState {
  /** Rolling waveform samples for display */
  waveformBuffer: number[]
  /** Most recent single sample value (for lightweight scalar subscriptions) */
  latestSample: number | null
  /** Maximum buffer size */
  maxBufferSize: number
  /** Current signal metrics */
  metrics: SignalMetrics | null
  /** Current AI status */
  aiStatus: AIStatus | null
  /** Current event type label */
  currentEventType: string
  /** Sample rate */
  sampleRate: number
  /** Timestamp of last update */
  lastUpdate: string | null

  appendSamples: (samples: number[]) => void
  setMetrics: (m: SignalMetrics) => void
  setAIStatus: (a: AIStatus) => void
  setCurrentEventType: (t: string) => void
  clearBuffer: () => void
}

export const useSignalStore = create<SignalState>((set) => ({
  waveformBuffer: [],
  latestSample: null,
  maxBufferSize: 4096,
  metrics: null,
  aiStatus: null,
  currentEventType: 'background',
  sampleRate: 100,
  lastUpdate: null,

  appendSamples: (samples) => {
    if (!samples || samples.length === 0) return
    set((state) => {
      const last = samples[samples.length - 1]
      let trimmed: number[]
      if (samples.length >= state.maxBufferSize) {
        trimmed = samples.slice(-state.maxBufferSize)
      } else {
        const keep = state.maxBufferSize - samples.length
        trimmed = state.waveformBuffer.slice(-keep).concat(samples)
      }
      return {
        waveformBuffer: trimmed,
        latestSample: last,
        lastUpdate: new Date().toISOString(),
      }
    })
  },

  setMetrics: (m) => set({ metrics: m }),
  setAIStatus: (a) => set({ aiStatus: a }),
  setCurrentEventType: (t) => set({ currentEventType: t }),
  clearBuffer: () => set({ waveformBuffer: [], latestSample: null, lastUpdate: null }),
}))

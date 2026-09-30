import { create } from 'zustand'
import type { AIStatus, SignalMetrics } from '@/types'

interface SignalState {
  /** Rolling waveform samples for display */
  waveformBuffer: number[]
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
  maxBufferSize: 4096,
  metrics: null,
  aiStatus: null,
  currentEventType: 'background',
  sampleRate: 100,
  lastUpdate: null,

  appendSamples: (samples) =>
    set((state) => {
      const newBuffer = [...state.waveformBuffer, ...samples]
      const trimmed =
        newBuffer.length > state.maxBufferSize
          ? newBuffer.slice(-state.maxBufferSize)
          : newBuffer
      return {
        waveformBuffer: trimmed,
        lastUpdate: new Date().toISOString(),
      }
    }),

  setMetrics: (m) => set({ metrics: m }),
  setAIStatus: (a) => set({ aiStatus: a }),
  setCurrentEventType: (t) => set({ currentEventType: t }),
  clearBuffer: () => set({ waveformBuffer: [], lastUpdate: null }),
}))

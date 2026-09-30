import type { DemoStatus } from '@/types'
import { create } from 'zustand'

interface DemoState {
  status: DemoStatus | null
  setStatus: (s: DemoStatus | null) => void
  isRunning: boolean
}

export const useDemoStore = create<DemoState>((set) => ({
  status: null,
  setStatus: (s) => set({ status: s, isRunning: s?.running || false }),
  isRunning: false,
}))

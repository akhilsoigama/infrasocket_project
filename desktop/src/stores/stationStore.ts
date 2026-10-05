import { create } from 'zustand'
import type { Station } from '@/types'

interface StationState {
  stations: Station[]
  selectedStation: string
  acknowledgedAnomalies: Record<string, boolean>;
  setStations: (s: Station[]) => void
  setSelectedStation: (id: string) => void
  acknowledge: (id: string) => void
}

export const useStationStore = create<StationState>((set) => ({
  stations: [],
  selectedStation: 'INFRA-001',
  acknowledgedAnomalies: {},
  setStations: (s) => set({ stations: s }),
  setSelectedStation: (id) => set({ selectedStation: id }),
  acknowledge: (id) => set((s) => ({ acknowledgedAnomalies: { ...s.acknowledgedAnomalies, [id]: true } })),
}))

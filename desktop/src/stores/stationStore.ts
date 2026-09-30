import { create } from 'zustand'
import type { Station } from '@/types'

interface StationState {
  stations: Station[]
  selectedStation: string
  setStations: (s: Station[]) => void
  setSelectedStation: (id: string) => void
}

export const useStationStore = create<StationState>((set) => ({
  stations: [],
  selectedStation: 'INFRA-001',
  setStations: (s) => set({ stations: s }),
  setSelectedStation: (id) => set({ selectedStation: id }),
}))

import { create } from 'zustand'
import type { InfrasoundEvent } from '@/types'

interface EventState {
  events: InfrasoundEvent[]
  selectedEvent: InfrasoundEvent | null
  sheetOpen: boolean
  addEvent: (e: InfrasoundEvent) => void
  setEvents: (e: InfrasoundEvent[]) => void
  setSelectedEvent: (e: InfrasoundEvent | null) => void
  setSheetOpen: (open: boolean) => void
}

export const useEventStore = create<EventState>((set) => ({
  events: [],
  selectedEvent: null,
  sheetOpen: false,

  addEvent: (e) =>
    set((state) => ({
      events: [e, ...state.events].slice(0, 200),
    })),

  setEvents: (e) => set({ events: e }),
  setSelectedEvent: (e) => set({ selectedEvent: e, sheetOpen: e !== null }),
  setSheetOpen: (open) =>
    set({ sheetOpen: open, selectedEvent: open ? undefined : null }),
}))

import { create } from 'zustand'
import type { ConnectionStatus, SystemHealth } from '@/types'

interface SystemState {
  apiStatus: ConnectionStatus
  dbStatus: ConnectionStatus
  wsStatus: ConnectionStatus
  health: SystemHealth | null
  sidebarCollapsed: boolean
  dataSource: 'demo' | 'dataset' | 'live_sensor'

  setApiStatus: (s: ConnectionStatus) => void
  setDbStatus: (s: ConnectionStatus) => void
  setWsStatus: (s: ConnectionStatus) => void
  setHealth: (h: SystemHealth) => void
  toggleSidebar: () => void
  setSidebarCollapsed: (c: boolean) => void
  setDataSource: (d: 'demo' | 'dataset' | 'live_sensor') => void
}

export const useSystemStore = create<SystemState>((set) => ({
  apiStatus: 'disconnected',
  dbStatus: 'disconnected',
  wsStatus: 'disconnected',
  health: null,
  sidebarCollapsed: false,
  dataSource: 'demo',

  setApiStatus: (s) => set({ apiStatus: s }),
  setDbStatus: (s) => set({ dbStatus: s }),
  setWsStatus: (s) => set({ wsStatus: s }),
  setHealth: (h) =>
    set({
      health: h,
      apiStatus: 'connected',
      dbStatus: h.database ? 'connected' : 'disconnected',
    }),
  toggleSidebar: () =>
    set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
  setSidebarCollapsed: (c) => set({ sidebarCollapsed: c }),
  setDataSource: (d) => set({ dataSource: d }),
}))

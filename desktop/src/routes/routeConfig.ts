import {
  Activity,
  AlertTriangle,
  BarChart3,
  BrainCircuit,
  History,
  LayoutDashboard,
  Radio,
  Settings,
  Sliders,
  type LucideIcon,
} from 'lucide-react'

export const ROUTES = {
  OVERVIEW: '/',
  LIVE_MONITORING: '/live',
  SIGNAL_ANALYSIS: '/analysis',
  STATIONS: '/stations',
  EVENTS: '/events',
  AI_INSIGHTS: '/ai-insights',
  CALIBRATION: '/calibration',
  HISTORICAL_DATA: '/history',
  SETTINGS: '/settings',
} as const

export type RouteKey = keyof typeof ROUTES
export type RoutePath = (typeof ROUTES)[RouteKey]

export interface RouteItem {
  path: RoutePath | string
  label: string
  shortLabel?: string
  description: string
  icon: LucideIcon
  category: 'TELEMETRY' | 'ARRAY & AI' | 'SYSTEM'
  badge?: string
}

export const ROUTE_ITEMS: RouteItem[] = [
  // TELEMETRY
  {
    path: ROUTES.OVERVIEW,
    label: 'Monitoring Overview',
    shortLabel: 'Overview',
    description: 'Infrasound system telemetry (0.01–20 Hz), hardware status & data source overview',
    icon: LayoutDashboard,
    category: 'TELEMETRY',
  },
  {
    path: ROUTES.LIVE_MONITORING,
    label: 'Live Monitoring',
    shortLabel: 'Waveforms',
    description: 'Microbarometer oscilloscope: live sensor stream, recorded datasets & demo signals',
    icon: Activity,
    category: 'TELEMETRY',
    badge: 'LIVE',
  },
  {
    path: ROUTES.SIGNAL_ANALYSIS,
    label: 'Signal Analysis',
    shortLabel: 'DSP & Spectra',
    description: 'Power Spectral Density (0.01–20 Hz), windowed analysis, filtering & comparison',
    icon: BarChart3,
    category: 'TELEMETRY',
    badge: 'DSP',
  },

  // ARRAY & AI
  {
    path: ROUTES.STATIONS,
    label: 'Sensor Network',
    shortLabel: 'Stations',
    description: 'Atmospheric microbarometer array geometry, coordinates, and telemetry channels',
    icon: Radio,
    category: 'ARRAY & AI',
  },
  {
    path: ROUTES.EVENTS,
    label: 'Event Catalog',
    shortLabel: 'Events',
    description: 'Cataloged infrasound events: volcanic tremors, explosions, and microbarom arrivals',
    icon: AlertTriangle,
    category: 'ARRAY & AI',
  },
  {
    path: ROUTES.AI_INSIGHTS,
    label: 'Anomaly Engine',
    shortLabel: 'Outlier Analysis',
    description: 'Rule-based signal analysis & Isolation Forest statistical outlier detection',
    icon: BrainCircuit,
    category: 'ARRAY & AI',
    badge: 'AUDIT',
  },

  // SYSTEM
  {
    path: ROUTES.CALIBRATION,
    label: 'Calibration & Testing',
    shortLabel: 'Calibration',
    description: 'Frequency response (0.01–20 Hz), noise floor benchmarks & laboratory validation',
    icon: Sliders,
    category: 'SYSTEM',
  },
  {
    path: ROUTES.HISTORICAL_DATA,
    label: 'Recorded Datasets',
    shortLabel: 'Datasets',
    description: 'Explosion, volcanic, and user-imported infrasound archives & CSV export',
    icon: History,
    category: 'SYSTEM',
  },
  {
    path: ROUTES.SETTINGS,
    label: 'Hardware & Settings',
    shortLabel: 'Settings',
    description: 'Hardware acquisition architecture, digitizer interfaces & system diagnostics',
    icon: Settings,
    category: 'SYSTEM',
  },
]

export function getRouteByPath(pathname: string): RouteItem | undefined {
  return ROUTE_ITEMS.find((r) => r.path === pathname)
}

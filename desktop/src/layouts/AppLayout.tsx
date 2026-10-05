import { useEffect } from 'react'
import { Link, Outlet, useLocation } from 'react-router-dom'
import {
  Activity,
  AlertTriangle,
  BarChart2,
  BrainCircuit,
  Database,
  History,
  LayoutDashboard,
  Radio,
  Settings,
} from 'lucide-react'

import { useSystemStore } from '@/stores/systemStore'
import { api } from '@/services/api'
import { cn } from '@/lib/utils'
import { useRealtimeSignal } from '@/hooks/useRealtimeSignal'

const NAV_ITEMS = [
  { path: '/', label: 'Overview', icon: LayoutDashboard },
  { path: '/live', label: 'Live Monitoring', icon: Activity },
  { path: '/stations', label: 'Stations', icon: Radio },
  { path: '/events', label: 'Events', icon: AlertTriangle },
  { path: '/ai', label: 'AI Insights', icon: BrainCircuit },
  { path: '/history', label: 'Historical Data', icon: History },
  { path: '/settings', label: 'Settings', icon: Settings },
]

export default function AppLayout() {
  const { pathname, search } = useLocation()
  const queryParams = new URLSearchParams(search)
  const activeStation = queryParams.get('station')
  const { setHealth, apiStatus, dbStatus, wsStatus } = useSystemStore()
  
  // Connect to websocket globally
  useRealtimeSignal()

  useEffect(() => {
    // Check health on mount
    const checkHealth = async () => {
      try {
        const health = await api.getHealth()
        setHealth(health)
      } catch (e) {
        useSystemStore.getState().setApiStatus('error')
      }
    }
    checkHealth()
    const interval = setInterval(checkHealth, 30000)
    return () => clearInterval(interval)
  }, [setHealth])

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background text-foreground">
      {/* Sidebar */}
      <aside className="flex w-64 flex-col border-r bg-card transition-sidebar">
        {/* Header */}
        <div className="flex h-14 items-center gap-2 border-b px-6">
          <Activity className="h-6 w-6 text-primary" />
          <div className="flex flex-col">
            <span className="font-bold leading-tight">INFRA SOCKET</span>
            <span className="text-2xs text-muted-foreground uppercase tracking-widest">
              AI Monitoring
            </span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 p-4 overflow-y-auto">
          {NAV_ITEMS.map(({ path, label, icon: Icon }) => {
            let displayLabel = label;
            if (path === '/live' && activeStation && pathname === '/live') {
              displayLabel = `Live Monitoring (${activeStation})`;
            }
            
            return (
              <Link
                key={path}
                to={path}
                className={cn(
                  'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                  pathname === path
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                )}
              >
                <Icon className="h-4 w-4" />
                {displayLabel}
              </Link>
            )
          })}
        </nav>

        {/* Status bar */}
        <div className="border-t bg-card p-4">
          <div className="space-y-2 text-xs">
            <StatusIndicator label="API" status={apiStatus} />
            <StatusIndicator label="Database" status={dbStatus} />
            <StatusIndicator label="WebSocket" status={wsStatus} />
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex flex-1 flex-col overflow-hidden relative">
        <div className="absolute inset-0 overflow-y-auto">
          <Outlet />
        </div>
      </main>
    </div>
  )
}

function StatusIndicator({ label, status }: { label: string; status: string }) {
  const getStatusColor = (s: string) => {
    switch (s) {
      case 'connected':
        return 'bg-success'
      case 'connecting':
        return 'bg-warning'
      case 'disconnected':
      case 'error':
        return 'bg-destructive'
      default:
        return 'bg-muted'
    }
  }

  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <div className="flex items-center gap-2">
        <span className="capitalize">{status}</span>
        <div
          className={cn('h-2 w-2 rounded-full', getStatusColor(status))}
        />
      </div>
    </div>
  )
}

import { useState, useEffect } from 'react'
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
  Sliders,
  Menu,
  ChevronLeft
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
  { path: '/calibration', label: 'Calibration', icon: Sliders },
  { path: '/history', label: 'Historical Data', icon: History },
  { path: '/settings', label: 'Settings', icon: Settings },
]

export default function AppLayout() {
  const [isCollapsed, setIsCollapsed] = useState(false)
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
      <aside className={cn("flex flex-col border-r bg-card transition-all duration-300 relative", isCollapsed ? "w-20" : "w-64")}>
        {/* Header */}
        <div className="flex h-14 items-center justify-between border-b px-4">
          {!isCollapsed ? (
            <div className="flex items-center gap-2 overflow-hidden">
              <Activity className="h-6 w-6 text-primary flex-shrink-0" />
              <div className="flex flex-col whitespace-nowrap">
                <span className="font-bold leading-tight">INFRA SOCKET</span>
                <span className="text-2xs text-muted-foreground uppercase tracking-widest">
                  AI Monitoring
                </span>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex justify-center">
              <Activity className="h-6 w-6 text-primary flex-shrink-0" />
            </div>
          )}
        </div>

        {/* Toggle Button */}
        <button 
          onClick={() => setIsCollapsed(!isCollapsed)} 
          className="absolute -right-3 top-4 bg-primary text-primary-foreground rounded-full p-1 shadow-md z-10 hover:scale-110 transition-transform"
        >
          {isCollapsed ? <Menu className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>

        {/* Navigation */}
        <nav className="flex-1 space-y-2 p-4 overflow-y-auto overflow-x-hidden">
          {NAV_ITEMS.map(({ path, label, icon: Icon }) => {
            let displayLabel = label;
            if (path === '/live' && activeStation && pathname === '/live') {
              displayLabel = `Live Monitoring (${activeStation})`;
            }
            
            return (
              <Link
                key={path}
                to={path}
                title={isCollapsed ? displayLabel : undefined}
                className={cn(
                  'flex items-center rounded-md transition-colors',
                  isCollapsed ? 'justify-center p-2' : 'gap-3 px-3 py-2',
                  pathname === path
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                )}
              >
                <Icon className={cn("flex-shrink-0", isCollapsed ? "h-6 w-6" : "h-5 w-5")} />
                {!isCollapsed && <span className="text-sm font-medium whitespace-nowrap truncate">{displayLabel}</span>}
              </Link>
            )
          })}
        </nav>

        {/* Status bar */}
        <div className="border-t bg-card p-4">
          <div className="space-y-3 text-xs">
            <StatusIndicator label="API" status={apiStatus} isCollapsed={isCollapsed} />
            <StatusIndicator label="Database" status={dbStatus} isCollapsed={isCollapsed} />
            <StatusIndicator label="WebSocket" status={wsStatus} isCollapsed={isCollapsed} />
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

function StatusIndicator({ label, status, isCollapsed }: { label: string; status: string, isCollapsed?: boolean }) {
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
    <div className={cn("flex items-center", isCollapsed ? "justify-center" : "justify-between")} title={isCollapsed ? `${label}: ${status}` : undefined}>
      {!isCollapsed && <span className="text-muted-foreground whitespace-nowrap">{label}</span>}
      <div className="flex items-center gap-2">
        {!isCollapsed && <span className="capitalize">{status}</span>}
        <div
          className={cn('h-2 w-2 rounded-full flex-shrink-0', getStatusColor(status))}
        />
      </div>
    </div>
  )
}

import { useState, useEffect } from 'react'
import { Link, Outlet, useLocation } from 'react-router-dom'
import {
  ChevronLeft,
  Menu,
  Play,
  StopCircle,
  Volume2,
  VolumeX,
  X,
  Radio,
} from 'lucide-react'

import { useSystemStore } from '@/stores/systemStore'
import { useDemoStore } from '@/stores/demoStore'
import { api } from '@/services/api'
import { cn } from '@/lib/utils'
import { useRealtimeSignal } from '@/hooks/useRealtimeSignal'
import { useUtcClock } from '@/hooks/useUtcClock'
import { ROUTE_ITEMS } from '@/routes/routeConfig'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ErrorBoundary } from '@/components/common/ErrorBoundary'

// Isolated clock components so AppLayout doesn't re-render every second
function UtcClockBadge() {
  const utcClock = useUtcClock()
  return (
    <div className="flex items-center gap-1.5 rounded-md border border-border/60 bg-background/80 px-2.5 py-1 font-mono text-xs shadow-xs shrink-0 whitespace-nowrap">
      <span className="text-muted-foreground text-3xs font-semibold">UTC</span>
      <span className="font-bold text-cyan-400 tabular-nums">{utcClock.timeStr}</span>
      <span className="hidden xl:inline text-3xs text-muted-foreground border-l border-border/40 pl-1.5 whitespace-nowrap">{utcClock.dateStr}</span>
    </div>
  )
}

function MobileUtcClock() {
  const utcClock = useUtcClock()
  return <div>UTC: <span className="font-bold text-cyan-400">{utcClock.timeStr}</span></div>
}

export default function AppLayout() {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isAudioMuted, setIsAudioMuted] = useState(false)
  const [logoError, setLogoError] = useState(false)
  const { pathname, search } = useLocation()
  const queryParams = new URLSearchParams(search)
  const activeStation = queryParams.get('station')
  
  const { setHealth, apiStatus, dbStatus, wsStatus } = useSystemStore()
  const { isRunning, setStatus } = useDemoStore()

  // Connect to websocket globally
  useRealtimeSignal()

  // Auto-close mobile drawer on route change
  useEffect(() => {
    setIsMobileMenuOpen(false)
  }, [pathname])

  useEffect(() => {
    const checkHealth = async () => {
      try {
        const health = await api.getHealth()
        setHealth(health)
      } catch {
        useSystemStore.getState().setApiStatus('error')
      }
    }
    checkHealth()
    const interval = setInterval(checkHealth, 30000)
    return () => clearInterval(interval)
  }, [setHealth])

  const handleToggleDemo = async () => {
    try {
      if (isRunning) {
        await api.stopDemo()
      } else {
        await api.startDemo()
      }
      const st = await api.getDemoStatus()
      setStatus(st)
    } catch (e) {
      console.error('Failed to toggle demo mode:', e)
    }
  }

  const categories: Array<'TELEMETRY' | 'ARRAY & AI' | 'SYSTEM'> = ['TELEMETRY', 'ARRAY & AI', 'SYSTEM']

  return (
    <div className="flex h-screen w-full flex-col overflow-hidden bg-background text-foreground select-none">
      {/* Top Observatory Scientific Telemetry Header - Fixed & Resilient on Desktop */}
      <header className="sticky top-0 z-30 flex h-14 w-full shrink-0 items-center justify-between border-b border-border/60 bg-card/95 px-3 sm:px-4 backdrop-blur-md select-none">
        {/* Brand / Logo + Mobile Menu Trigger */}
        <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
          {/* Mobile hamburger button */}
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden flex h-8 w-8 items-center justify-center rounded-md border border-border/60 bg-background/80 text-foreground hover:bg-muted/40 transition-colors"
            title="Toggle Navigation Menu"
          >
            {isMobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>

          {/* Logo with /logo.png */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="relative flex h-8 w-8 items-center justify-center rounded-lg overflow-hidden border border-primary/40 bg-card shadow-[0_0_12px_rgba(56,189,248,0.25)] flex-shrink-0">
              {!logoError ? (
                <img
                  src="/logo.png"
                  alt="InfraSocket Logo"
                  className="h-full w-full object-contain p-0.5"
                  onError={() => setLogoError(true)}
                />
              ) : (
                <span className="text-primary font-bold text-xs">IS</span>
              )}
            </div>
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-sm tracking-wider text-foreground font-mono group-hover:text-primary transition-colors whitespace-nowrap">
                  INFRA<span className="text-primary">SOCKET</span>
                </span>
                <Badge variant="outline" className="hidden sm:inline-flex px-1.5 py-0 text-3xs font-mono border-primary/40 text-primary">
                  v1.0
                </Badge>
              </div>
              <span className="hidden sm:inline-block text-xs font-mono text-muted-foreground tracking-wider whitespace-nowrap">
                Infrasound Monitoring & Signal Analysis System
              </span>
            </div>
          </Link>
        </div>

        {/* Center Scientific Telemetry (Observatory Clock, Bandwidth & Hardware Status) */}
        <div className="hidden md:flex items-center gap-2 lg:gap-3 shrink-0">
          <UtcClockBadge />

          <div className="hidden sm:flex items-center gap-1.5 rounded-md border border-border/60 bg-background/80 px-2.5 py-1 font-mono text-xs shadow-xs shrink-0 whitespace-nowrap">
            <span className="text-muted-foreground text-3xs font-semibold">BAND</span>
            <span className="font-bold text-emerald-400 whitespace-nowrap">0.01 – 20 Hz</span>
            <span className="hidden 2xl:inline text-3xs text-muted-foreground font-sans">• Target Infrasound</span>
          </div>

          <div className="hidden lg:flex items-center gap-1.5 rounded-md border border-border/60 bg-background/80 px-2.5 py-1 font-mono text-xs shadow-xs shrink-0 whitespace-nowrap">
            <span className="text-muted-foreground text-3xs font-semibold">SENSOR</span>
            <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse" />
            <span className="font-bold text-amber-400 whitespace-nowrap">Standby</span>
          </div>
        </div>

        {/* Right Controls & Telemetry Status cluster */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Mute Audio Alerts Toggle */}
          <button
            type="button"
            onClick={() => setIsAudioMuted(!isAudioMuted)}
            title={isAudioMuted ? 'Unmute Audio Alerts' : 'Mute Audio Alerts'}
            className="flex h-8 w-8 items-center justify-center rounded-md border border-border/60 bg-background/80 text-muted-foreground hover:text-foreground hover:bg-card transition-colors flex-shrink-0"
          >
            {isAudioMuted ? <VolumeX className="h-4 w-4 text-destructive" /> : <Volume2 className="h-4 w-4" />}
          </button>

          {/* WebSocket Live Telemetry Indicator */}
          <div
            className="hidden sm:flex items-center gap-1.5 rounded-md border border-border/60 bg-background/80 px-2.5 py-1 text-xs font-mono"
            title={`WebSocket: ${wsStatus}`}
          >
            {wsStatus === 'connected' ? (
              <>
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span className="text-emerald-400 font-bold text-2xs uppercase">LIVE</span>
              </>
            ) : (
              <>
                <span className="h-2 w-2 rounded-full bg-destructive flex-shrink-0" />
                <span className="text-muted-foreground text-2xs uppercase">{wsStatus}</span>
              </>
            )}
          </div>

          {/* Demo Control Trigger */}
          <Button
            size="sm"
            onClick={handleToggleDemo}
            variant={isRunning ? 'destructive' : 'default'}
            className="gap-1.5 font-mono text-xs h-8 px-2.5 sm:px-3"
          >
            {isRunning ? (
              <>
                <StopCircle className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Stop Demo</span>
                <span className="sm:hidden">Stop</span>
              </>
            ) : (
              <>
                <Play className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Start Demo</span>
                <span className="sm:hidden">Start</span>
              </>
            )}
          </Button>
        </div>
      </header>

      {/* Main App Body with Sidebar + Content Area */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* Desktop Sidebar Navigation */}
        <aside
          className={cn(
            'hidden md:flex flex-col border-r border-border/60 bg-card/90 transition-all duration-200 relative z-20',
            isCollapsed ? 'w-16' : 'w-64'
          )}
        >
          {/* Navigation Links Grouped by Category */}
          <nav className="flex-1 space-y-4 p-3 overflow-y-auto overflow-x-hidden">
            {categories.map((category) => {
              const items = ROUTE_ITEMS.filter((item) => item.category === category)
              return (
                <div key={category} className="space-y-1">
                  {!isCollapsed && (
                    <div className="px-3 py-1 text-3xs font-bold uppercase tracking-widest text-muted-foreground/80 font-mono">
                      {category}
                    </div>
                  )}

                  {items.map(({ path, label, shortLabel, icon: Icon, badge }) => {
                    const isActive = pathname === path || (path !== '/' && pathname.startsWith(path))
                    let displayLabel = isCollapsed ? shortLabel || label : label

                    if (path === '/live' && activeStation && pathname === '/live' && !isCollapsed) {
                      displayLabel = `Live (${activeStation})`
                    }

                    return (
                      <Link
                        key={path}
                        to={path}
                        title={isCollapsed ? label : undefined}
                        className={cn(
                          'flex items-center rounded-md font-mono text-xs transition-all relative group',
                          isCollapsed ? 'justify-center p-2.5' : 'justify-between px-3 py-2',
                          isActive
                            ? 'bg-primary/15 text-primary font-bold shadow-[0_0_12px_rgba(56,189,248,0.15)] border-l-2 border-primary'
                            : 'text-muted-foreground hover:bg-muted/40 hover:text-foreground'
                        )}
                      >
                        <div className="flex items-center gap-3 truncate">
                          <Icon className={cn('flex-shrink-0', isCollapsed ? 'h-5 w-5' : 'h-4 w-4', isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground')} />
                          {!isCollapsed && <span className="truncate">{displayLabel}</span>}
                        </div>

                        {!isCollapsed && badge && (
                          <Badge
                            variant={isActive ? 'default' : 'outline'}
                            className="text-3xs px-1.5 py-0 font-mono"
                          >
                            {badge}
                          </Badge>
                        )}
                      </Link>
                    )
                  })}
                </div>
              )
            })}
          </nav>

          {/* Bottom Diagnostics Summary */}
          <div className="border-t border-border/60 bg-card/95 p-3">
            {!isCollapsed ? (
              <div className="space-y-2 text-2xs font-mono">
                <div className="flex items-center justify-between text-muted-foreground">
                  <span>API Telemetry:</span>
                  <span className={cn('font-bold uppercase', apiStatus === 'connected' ? 'text-emerald-400' : 'text-destructive')}>
                    {apiStatus}
                  </span>
                </div>
                <div className="flex items-center justify-between text-muted-foreground">
                  <span>Database:</span>
                  <span className={cn('font-bold uppercase', dbStatus === 'connected' ? 'text-emerald-400' : 'text-amber-400')}>
                    {dbStatus === 'connected' ? 'POSTGRES' : 'MEMORY'}
                  </span>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <div
                  className={cn(
                    'h-2 w-2 rounded-full',
                    apiStatus === 'connected' ? 'bg-emerald-400' : 'bg-destructive'
                  )}
                  title={`API: ${apiStatus}`}
                />
              </div>
            )}

            {/* Collapse toggle button */}
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              type="button"
              className="mt-3 flex w-full items-center justify-center gap-1 rounded border border-border/40 bg-muted/20 py-1 text-3xs font-mono text-muted-foreground hover:bg-muted/40 hover:text-foreground transition-colors"
              title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
            >
              {isCollapsed ? <Menu className="h-3.5 w-3.5" /> : <ChevronLeft className="h-3.5 w-3.5" />}
              {!isCollapsed && <span>COLLAPSE</span>}
            </button>
          </div>
        </aside>

        {/* Mobile Slide-Out Navigation Drawer */}
        {isMobileMenuOpen && (
          <div className="fixed inset-0 z-50 md:hidden flex">
            {/* Backdrop */}
            <div
              className="fixed inset-0 bg-background/80 backdrop-blur-sm transition-opacity"
              onClick={() => setIsMobileMenuOpen(false)}
            />

            {/* Drawer Content */}
            <div className="relative flex flex-col w-72 max-w-[85vw] h-full bg-card border-r border-border/60 p-4 shadow-2xl z-10 animate-in slide-in-from-left duration-200">
              <div className="flex items-center justify-between pb-4 border-b border-border/40">
                <div className="flex items-center gap-2.5">
                  <div className="h-8 w-8 rounded-lg overflow-hidden border border-primary/40 bg-card p-0.5">
                    <img src="/logo.png" alt="Logo" className="h-full w-full object-contain" />
                  </div>
                  <div>
                    <span className="font-bold font-mono text-sm">INFRA<span className="text-primary">SOCKET</span></span>
                    <p className="text-3xs font-mono text-muted-foreground">Infrasound Observatory</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="rounded-md p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted/40"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Mobile Navigation List */}
              <nav className="flex-1 space-y-4 py-4 overflow-y-auto font-mono text-xs">
                {categories.map((category) => {
                  const items = ROUTE_ITEMS.filter((item) => item.category === category)
                  return (
                    <div key={category} className="space-y-1">
                      <div className="px-2 text-3xs font-bold uppercase tracking-widest text-muted-foreground/70">
                        {category}
                      </div>
                      {items.map(({ path, label, icon: Icon, badge }) => {
                        const isActive = pathname === path || (path !== '/' && pathname.startsWith(path))
                        return (
                          <Link
                            key={path}
                            to={path}
                            onClick={() => setIsMobileMenuOpen(false)}
                            className={cn(
                              'flex items-center justify-between rounded-md px-3 py-2 text-xs transition-colors',
                              isActive
                                ? 'bg-primary/15 text-primary font-bold border-l-2 border-primary'
                                : 'text-muted-foreground hover:bg-muted/30 hover:text-foreground'
                            )}
                          >
                            <div className="flex items-center gap-3">
                              <Icon className="h-4 w-4 flex-shrink-0" />
                              <span>{label}</span>
                            </div>
                            {badge && (
                              <Badge variant={isActive ? 'default' : 'outline'} className="text-3xs px-1.5 py-0 font-mono">
                                {badge}
                              </Badge>
                            )}
                          </Link>
                        )
                      })}
                    </div>
                  )
                })}
              </nav>

              <div className="border-t border-border/40 pt-3 text-2xs font-mono text-muted-foreground space-y-1">
                <MobileUtcClock />
                <div>Status: <span className="text-emerald-400 uppercase font-bold">{apiStatus}</span></div>
              </div>
            </div>
          </div>
        )}

        {/* Main Content Area */}
        <main className="flex flex-1 flex-col overflow-hidden relative bg-background min-w-0">
          <ErrorBoundary>
            <Outlet />
          </ErrorBoundary>
        </main>
      </div>
    </div>
  )
}

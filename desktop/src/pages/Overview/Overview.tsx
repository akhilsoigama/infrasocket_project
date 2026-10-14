import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  BarChart3,
  Brain,
  CheckCircle2,
  Cpu,
  Database,
  Gauge,
  Layers,
  Radio,
  Sliders,
  Waves,
  Zap,
} from 'lucide-react'
import { useQuery } from '@tanstack/react-query'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { PageHeader } from '@/components/common/PageHeader'
import { MetricTelemetryCard } from '@/components/scientific/MetricTelemetryCard'

import { api } from '@/services/api'
import { useDemoStore } from '@/stores/demoStore'
import { useSystemStore } from '@/stores/systemStore'
import { formatNumber, formatTimestamp } from '@/lib/utils'
import { useEventStore } from '@/stores/eventStore'
import { useSignalStore } from '@/stores/signalStore'
import { ROUTES } from '@/routes/routeConfig'

export default function OverviewPage() {
  const { isRunning, setStatus } = useDemoStore()
  const { dataSource, setDataSource } = useSystemStore()
  const latestEvents = useEventStore((state) => state.events.slice(0, 6))
  const metrics = useSignalStore((state) => state.metrics)
  const aiStatus = useSignalStore((state) => state.aiStatus)
  const latestSample = useSignalStore((state) => state.latestSample)

  // Hardware status query
  const { data: hardwareStatus } = useQuery({
    queryKey: ['hardware-status'],
    queryFn: api.getHardwareStatus,
    refetchInterval: 5000,
  })

  // Analytics query
  const { data: analytics } = useQuery({
    queryKey: ['analytics-summary'],
    queryFn: api.getAnalyticsSummary,
    refetchInterval: 5000,
  })

  // Status query
  const { data: demoStatus } = useQuery({
    queryKey: ['demo-status'],
    queryFn: api.getDemoStatus,
    refetchInterval: 2000,
  })

  useEffect(() => {
    if (demoStatus) {
      setStatus(demoStatus)
    }
  }, [demoStatus, setStatus])

  // Compute latest measured pressure variation (using lightweight scalar latestSample)
  const latestPressurePa =
    metrics?.peak_amplitude !== undefined
      ? metrics.peak_amplitude
      : latestSample !== null
      ? Math.abs(latestSample)
      : null

  return (
    <div className="flex-1 space-y-4 sm:space-y-6 p-4 sm:p-6 lg:p-8 overflow-y-auto min-w-0">
      <PageHeader
        title="Microbarometer Infrasound Observatory"
        subtitle="TARGET FREQUENCY BAND: 0.01 – 20.0 Hz • MULTI-SOURCE ACQUISITION • SCIENTIFIC DSP"
        badgeText={
          dataSource === 'live_sensor'
            ? 'LIVE SENSOR (STANDBY)'
            : dataSource === 'dataset'
            ? 'RECORDED DATASET'
            : isRunning
            ? 'DEMO STREAM (SYNTHETIC)'
            : 'DEMO (PAUSED)'
        }
        badgeVariant={
          dataSource === 'live_sensor'
            ? 'secondary'
            : dataSource === 'dataset'
            ? 'default'
            : isRunning
            ? 'success'
            : 'secondary'
        }
      >
        <div className="flex flex-wrap items-center gap-2">
          <Button asChild variant="outline" size="sm" className="gap-1.5 font-mono text-xs">
            <Link to={ROUTES.LIVE_MONITORING}>
              <Activity className="h-3.5 w-3.5 text-cyan-400" />
              Live Oscilloscope
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm" className="gap-1.5 font-mono text-xs">
            <Link to={ROUTES.SIGNAL_ANALYSIS}>
              <BarChart3 className="h-3.5 w-3.5 text-primary" />
              Spectral Analysis
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm" className="gap-1.5 font-mono text-xs">
            <Link to={ROUTES.CALIBRATION}>
              <Sliders className="h-3.5 w-3.5 text-amber-400" />
              Calibration
            </Link>
          </Button>
        </div>
      </PageHeader>

      {/* Primary Status & Data Source Selector Banner */}
      <Card className="border-border/60 bg-card/60 backdrop-blur-md min-w-0">
        <CardContent className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground font-mono">
                Current Ingestion Source:
              </span>
              <Badge
                variant={
                  dataSource === 'live_sensor'
                    ? 'outline'
                    : dataSource === 'dataset'
                    ? 'default'
                    : 'secondary'
                }
                className="font-mono text-xs uppercase"
              >
                {dataSource === 'live_sensor'
                  ? 'Physical Microbarometer (Standby)'
                  : dataSource === 'dataset'
                  ? 'Recorded Infrasound Dataset'
                  : 'Demo Mode (Synthetic Generator)'}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground font-mono">
              Operating bandwidth covers microbaroms (0.1–0.5 Hz), volcanic tremors, bolides & blast shockwaves.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <Button
              size="sm"
              variant={dataSource === 'live_sensor' ? 'default' : 'outline'}
              onClick={() => setDataSource('live_sensor')}
              className="font-mono text-xs h-8"
            >
              <Cpu className="h-3.5 w-3.5 mr-1" />
              Live Sensor
            </Button>
            <Button
              size="sm"
              variant={dataSource === 'dataset' ? 'default' : 'outline'}
              onClick={() => setDataSource('dataset')}
              className="font-mono text-xs h-8"
            >
              <Database className="h-3.5 w-3.5 mr-1" />
              Recorded Data
            </Button>
            <Button
              size="sm"
              variant={dataSource === 'demo' ? 'default' : 'outline'}
              onClick={() => setDataSource('demo')}
              className="font-mono text-xs h-8"
            >
              <Waves className="h-3.5 w-3.5 mr-1" />
              Demo Data
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Top Scientific Metrics Cards */}
      <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 min-w-0">
        <MetricTelemetryCard
          label="Target Frequency Band"
          value="0.01 – 20.0"
          unit="Hz"
          subtext="Infrasonic atmospheric band"
          icon={Waves}
          tone="cyan"
        />
        <MetricTelemetryCard
          label="Hardware Interface"
          value={hardwareStatus?.is_connected ? 'Connected' : 'Standby'}
          subtext={hardwareStatus?.status_message || 'Live sensor not connected'}
          icon={Cpu}
          tone={hardwareStatus?.is_connected ? 'emerald' : 'amber'}
        />
        <MetricTelemetryCard
          label="Pressure Variation"
          value={latestPressurePa !== null ? formatNumber(latestPressurePa, 4) : 'Standby'}
          unit={latestPressurePa !== null ? 'Pa' : ''}
          subtext={dataSource === 'demo' ? 'Synthetic amplitude' : 'Acoustic differential (Pa)'}
          icon={Gauge}
          tone="emerald"
        />
        <MetricTelemetryCard
          label="Cataloged Events"
          value={analytics?.events_today || latestEvents.length}
          unit="Events"
          subtext="Explosions, volcanic & ambient"
          icon={Activity}
          tone="default"
        />
      </div>

      {/* Main Two-Column Telemetry & Dataflow Section */}
      <div className="grid gap-6 grid-cols-1 lg:grid-cols-12 min-w-0">
        {/* Real-time Telemetry & Ingestion Status */}
        <Card className="lg:col-span-7 xl:col-span-7 border-border/50 bg-card/80 shadow-lg min-w-0">
          <CardHeader className="flex flex-row items-center justify-between border-b border-border/40 pb-3">
            <div>
              <CardTitle className="text-lg font-mono">Atmospheric Telemetry & Acquisition</CardTitle>
              <CardDescription className="text-xs font-mono">
                Active Source: <strong className="text-cyan-400 capitalize">{dataSource.replace('_', ' ')}</strong>
                {' '}• Sample Rate: <strong className="text-foreground">{metrics ? '40.0 Hz' : 'Standby'}</strong>
              </CardDescription>
            </div>
            <Badge variant="outline" className="font-mono text-xs text-primary border-primary/30">
              0.01 – 20 Hz
            </Badge>
          </CardHeader>

          <CardContent className="pt-6">
            {dataSource === 'live_sensor' && !hardwareStatus?.is_connected ? (
              <div className="space-y-4 rounded-lg border border-amber-500/30 bg-amber-500/5 p-6 font-mono text-xs">
                <div className="flex items-center gap-3">
                  <Cpu className="h-6 w-6 text-amber-400 flex-shrink-0" />
                  <div>
                    <h4 className="text-sm font-bold text-amber-400">Live Sensor Not Connected</h4>
                    <p className="text-2xs text-muted-foreground mt-0.5">
                      Hardware acquisition service is waiting for physical microbarometer digitizer.
                    </p>
                  </div>
                </div>
                <Separator className="border-border/40" />
                <div className="space-y-2 text-2xs text-muted-foreground">
                  <div className="flex justify-between">
                    <span>Hardware Connection State:</span>
                    <span className="font-bold text-amber-400 uppercase">STANDBY / DISCONNECTED</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Target Interface:</span>
                    <span className="font-bold text-foreground">RS-232 / USB CDC / 24-bit DAQ ADC</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Target Frequency Range:</span>
                    <span className="font-bold text-emerald-400">0.01 Hz to 20.0 Hz</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Sensitivity Calibration:</span>
                    <span className="font-bold text-muted-foreground">Pending laboratory characterization</span>
                  </div>
                </div>
                <div className="pt-2 flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setDataSource('dataset')}
                    className="text-xs h-7 font-mono"
                  >
                    View Recorded Datasets (IMA / ENCR)
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setDataSource('demo')}
                    className="text-xs h-7 font-mono"
                  >
                    Run Demo Synthetic Stream
                  </Button>
                </div>
              </div>
            ) : metrics ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Physical Signal Metrics */}
                <div className="space-y-4 rounded-lg border border-border/40 bg-muted/20 p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono text-muted-foreground uppercase">Signal Quality</span>
                    <span className="text-xl font-bold font-mono text-cyan-400">
                      {formatNumber(metrics.signal_quality, 1)}%
                    </span>
                  </div>
                  <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-cyan-400 transition-all duration-300"
                      style={{ width: `${Math.min(100, metrics.signal_quality)}%` }}
                    />
                  </div>

                  <Separator className="border-border/40" />

                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono text-muted-foreground uppercase">RMS Variation</span>
                    <span className="text-base font-bold font-mono text-foreground">
                      {formatNumber(metrics.rms, 4)} <span className="text-xs text-muted-foreground">Pa</span>
                    </span>
                  </div>

                  <Separator className="border-border/40" />

                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono text-muted-foreground uppercase">Signal-to-Noise Ratio</span>
                    <span className="text-base font-bold font-mono text-emerald-400">
                      {formatNumber(metrics.snr_db, 1)} <span className="text-xs text-muted-foreground">dB</span>
                    </span>
                  </div>

                  <Separator className="border-border/40" />

                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono text-muted-foreground uppercase">Dominant Frequency</span>
                    <span className="text-base font-bold font-mono text-foreground">
                      {formatNumber(metrics.dominant_frequency_hz || 0.22, 2)} <span className="text-xs text-muted-foreground">Hz</span>
                    </span>
                  </div>
                </div>

                {/* Rule-Based Signal Analysis & Statistical Outlier Engine */}
                <div className="space-y-4 rounded-lg border border-border/40 bg-card p-5 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Brain className="h-4 w-4 text-primary" />
                      <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground font-mono">
                        Rule-Based & Outlier Engine
                      </span>
                    </div>
                    <Badge variant="outline" className="font-mono text-3xs">
                      IsoForest + Heuristics
                    </Badge>
                  </div>

                  {aiStatus ? (
                    <div className="space-y-4 pt-1">
                      <div>
                        <span className="text-3xs text-muted-foreground font-mono uppercase">Arrival State</span>
                        <div className="mt-1">
                          <Badge
                            variant={aiStatus.is_anomaly ? 'destructive' : 'success'}
                            className="text-xs px-3 py-1 font-mono tracking-wider"
                          >
                            {aiStatus.is_anomaly ? 'ANOMALOUS EVENT DETECTED' : 'NOMINAL INFRASOUND BACKGROUND'}
                          </Badge>
                        </div>
                      </div>

                      <div className="rounded border border-border/40 bg-background/60 p-3 space-y-1">
                        <div className="flex justify-between text-xs font-mono">
                          <span className="text-muted-foreground">Outlier Score:</span>
                          <span className="font-bold text-foreground">{formatNumber(aiStatus.score, 4)}</span>
                        </div>
                        <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                          <div
                            className={`h-full transition-all duration-300 ${aiStatus.is_anomaly ? 'bg-destructive' : 'bg-emerald-400'}`}
                            style={{ width: `${Math.min(100, Math.max(5, (aiStatus.score + 0.5) * 100))}%` }}
                          />
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-xs font-mono">
                        <span className="text-muted-foreground">Transient Pattern:</span>
                        <span className="font-semibold text-foreground capitalize">
                          {aiStatus.event_type.replace(/_/g, ' ')}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="flex h-32 items-center justify-center text-xs font-mono text-muted-foreground">
                      Awaiting signal feature window evaluation...
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex h-52 flex-col items-center justify-center text-muted-foreground font-mono text-xs gap-3">
                <Radio className="h-8 w-8 text-primary animate-pulse" />
                <p>Monitoring pipeline in standby mode.</p>
                <div className="flex gap-2 mt-2">
                  <Button
                    size="sm"
                    variant="default"
                    onClick={() => {
                      setDataSource('dataset')
                    }}
                    className="font-mono text-xs"
                  >
                    Load Recorded Datasets
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setDataSource('demo')
                      if (!isRunning) api.startDemo().then(api.getDemoStatus).then(setStatus)
                    }}
                    className="font-mono text-xs"
                  >
                    Start Demo Mode
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Detections & Recorded Events */}
        <Card className="lg:col-span-5 xl:col-span-5 border-border/50 bg-card/80 shadow-lg flex flex-col min-w-0">
          <CardHeader className="flex flex-row items-center justify-between border-b border-border/40 pb-3">
            <div>
              <CardTitle className="text-lg font-mono">Event Catalog</CardTitle>
              <CardDescription className="text-xs font-mono">
                Recorded & detected infrasound signals
              </CardDescription>
            </div>
            <Button asChild variant="ghost" size="sm" className="h-7 text-xs font-mono gap-1 text-primary hover:text-primary">
              <Link to={ROUTES.EVENTS}>
                View All <ArrowRight className="h-3 w-3" />
              </Link>
            </Button>
          </CardHeader>

          <CardContent className="flex-1 p-4 overflow-y-auto">
            <div className="space-y-3 font-mono">
              {latestEvents.length > 0 ? (
                latestEvents.map((event) => (
                  <div
                    key={event.event_id}
                    className="flex items-center justify-between rounded-md border border-border/40 bg-muted/20 p-2.5 transition-colors hover:bg-muted/40"
                  >
                    <div className="space-y-0.5 truncate pr-2">
                      <p className="text-xs font-semibold text-foreground capitalize truncate">
                        {event.event_type.replace(/_/g, ' ')}
                      </p>
                      <p className="text-3xs text-muted-foreground truncate">
                        <strong className="text-primary">{event.station_id}</strong> • {formatTimestamp(event.timestamp)}
                      </p>
                    </div>
                    <div className="flex-shrink-0">
                      {event.is_anomaly ? (
                        <Badge variant="destructive" className="text-3xs uppercase font-mono">
                          Anomaly
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="text-3xs uppercase font-mono">
                          Normal
                        </Badge>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="space-y-2 font-mono text-xs">
                  <div className="rounded border border-border/40 bg-muted/20 p-2.5">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-foreground">Beirut Explosion (IMA Array)</span>
                      <Badge variant="outline" className="text-3xs font-mono">RECORDED</Badge>
                    </div>
                    <p className="text-3xs text-muted-foreground mt-1">High-yield blast wave • 40 Hz • ±150 Pa transient</p>
                  </div>
                  <div className="rounded border border-border/40 bg-muted/20 p-2.5">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-foreground">Mount Etna Volcanic (ENCR1)</span>
                      <Badge variant="outline" className="text-3xs font-mono">RECORDED</Badge>
                    </div>
                    <p className="text-3xs text-muted-foreground mt-1">Strombolian degassing tremor • 20 Hz • Sustained</p>
                  </div>
                  <div className="rounded border border-border/40 bg-muted/20 p-2.5">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-foreground">Oceanic Microbaroms</span>
                      <Badge variant="outline" className="text-3xs font-mono">CONTINUOUS</Badge>
                    </div>
                    <p className="text-3xs text-muted-foreground mt-1">0.15 - 0.35 Hz wave-wave interaction harmonics</p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Hardware Integration Architecture Section (Section 4) */}
      <Card className="border-border/50 bg-card/70 shadow-md">
        <CardHeader className="border-b border-border/40 pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base font-mono flex items-center gap-2">
                <Layers className="h-4 w-4 text-cyan-400" />
                Microbarometer Hardware Integration Architecture
              </CardTitle>
              <CardDescription className="text-xs font-mono">
                Modular physical acquisition to visualization pipeline (Target Range: 0.01 – 20.0 Hz)
              </CardDescription>
            </div>
            <Badge variant="outline" className="font-mono text-3xs text-cyan-400 border-cyan-400/40">
              MODULAR STACK
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="p-4 sm:p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-3 text-center font-mono min-w-0">
            {[
              { step: 1, title: 'Pressure Fluctuations', desc: 'Atmospheric infrasound (0.01 - 20 Hz)', status: 'Physical Input', color: 'border-blue-500/40 bg-blue-500/10' },
              { step: 2, title: 'Sensing Assembly', desc: 'Differential acoustic transducer', status: 'Hardware Stage', color: 'border-cyan-500/40 bg-cyan-500/10' },
              { step: 3, title: 'Signal Conditioning', desc: 'Analog preamp & anti-aliasing filter', status: 'Hardware Stage', color: 'border-teal-500/40 bg-teal-500/10' },
              { step: 4, title: 'Digitizer / DAQ', desc: '24-bit delta-sigma ADC or Serial Stream', status: 'Hardware Interface', color: 'border-amber-500/40 bg-amber-500/10' },
              { step: 5, title: 'Acquisition Service', desc: 'Stream manager & timestamp alignment', status: 'Software Active', color: 'border-emerald-500/40 bg-emerald-500/10' },
              { step: 6, title: 'InfraSocket Pipeline', desc: '0.01-20 Hz Butterworth DSP & Features', status: 'Software Active', color: 'border-emerald-500/40 bg-emerald-500/10' },
              { step: 7, title: 'Live Oscilloscope', desc: 'Real-time telemetry, PSD & audit log', status: 'Software Active', color: 'border-emerald-500/40 bg-emerald-500/10' },
            ].map((s) => (
              <div key={s.step} className={`rounded-lg border p-3 flex flex-col justify-between ${s.color}`}>
                <div className="text-3xs font-bold text-muted-foreground uppercase mb-1">
                  Step 0{s.step}
                </div>
                <div className="text-xs font-bold text-foreground my-1 leading-snug">
                  {s.title}
                </div>
                <div className="text-3xs text-muted-foreground leading-normal mb-2">
                  {s.desc}
                </div>
                <Badge variant="outline" className="text-3xs py-0 mx-auto font-mono">
                  {s.status}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

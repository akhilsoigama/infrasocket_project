import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  CheckCircle2,
  Server,
  Settings as SettingsIcon,
  XCircle,
  Database,
  RefreshCw,
  Cpu,
  Sliders,
  Shield,
  Wifi,
} from 'lucide-react'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { PageHeader } from '@/components/common/PageHeader'
import { MetricTelemetryCard } from '@/components/scientific/MetricTelemetryCard'
import { api } from '@/services/api'
import { useSystemStore } from '@/stores/systemStore'

export default function Settings() {
  const [anomalyContamination, setAnomalyContamination] = useState('0.05')
  const [sensitivityPreset, setSensitivityPreset] = useState('0.00025')
  const [pingLatency, setPingLatency] = useState<number | null>(12)
  const [isPinging, setIsPinging] = useState(false)
  const { wsStatus, apiStatus } = useSystemStore()

  // Fetch system health
  const { data: health, isLoading, refetch } = useQuery({
    queryKey: ['system-health'],
    queryFn: api.getHealth,
    refetchInterval: 10000,
  })

  const handlePingServer = async () => {
    setIsPinging(true)
    const t0 = performance.now()
    try {
      await api.getHealth()
      const dt = Math.round(performance.now() - t0)
      setPingLatency(dt)
    } catch {
      setPingLatency(null)
    } finally {
      setIsPinging(false)
    }
  }

  return (
    <div className="flex h-full flex-col space-y-4 sm:space-y-6 p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto overflow-y-auto min-w-0">
      <PageHeader
        title="System Diagnostics & Settings"
        subtitle="DAEMON CONNECTION • TELEMETRY LATENCY • ACOUSTIC SENSITIVITY CALIBRATION"
        badgeText={health?.status === 'healthy' ? 'ALL SYSTEMS OPERATIONAL' : 'DEGRADED'}
        badgeVariant={health?.status === 'healthy' ? 'success' : 'destructive'}
      >
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            refetch()
            handlePingServer()
          }}
          disabled={isLoading || isPinging}
          className="gap-1.5 font-mono text-xs"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isPinging ? 'animate-spin text-primary' : ''}`} />
          Diagnostic Ping
        </Button>
      </PageHeader>

      {/* Connection Telemetry Cards */}
      <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 min-w-0">
        <MetricTelemetryCard
          label="API Latency"
          value={pingLatency !== null ? pingLatency : 'ERR'}
          unit="ms"
          subtext="FastAPI REST roundtrip"
          icon={Server}
          tone="cyan"
        />
        <MetricTelemetryCard
          label="WebSocket"
          value={wsStatus.toUpperCase()}
          subtext="Telemetry binary pipe"
          icon={Wifi}
          tone={wsStatus === 'connected' ? 'emerald' : 'rose'}
        />
        <MetricTelemetryCard
          label="Storage Engine"
          value={health?.database ? 'PostgreSQL' : 'In-Memory'}
          subtext={health?.database ? 'Persistent DB online' : 'Demo volatile buffer'}
          icon={Database}
          tone={health?.database ? 'emerald' : 'amber'}
        />
        <MetricTelemetryCard
          label="Client Core"
          value="v1.0.0"
          subtext="Electron + React 18 + DSP"
          icon={Cpu}
          tone="default"
        />
      </div>

      <div className="grid gap-6 grid-cols-1 md:grid-cols-2 min-w-0">
        {/* Connection Diagnostics */}
        <Card className="border-border/50 bg-card/80 shadow-lg">
          <CardHeader className="border-b border-border/40 pb-3">
            <CardTitle className="text-base font-mono flex items-center gap-2">
              <Server className="h-4 w-4 text-primary" /> Backend Engine Health
            </CardTitle>
            <CardDescription className="text-xs font-mono">
              Live daemon tracking and endpoint verification
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6 space-y-4 font-mono text-xs">
            {health ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">API Server Process:</span>
                  <Badge variant={health.status === 'healthy' ? 'default' : 'destructive'} className="gap-1 font-mono text-3xs">
                    {health.status === 'healthy' ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                    {health.status.toUpperCase()}
                  </Badge>
                </div>
                <Separator className="border-border/30" />
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">PostgreSQL Database:</span>
                  <Badge variant={health.database ? 'default' : 'secondary'} className="gap-1 font-mono text-3xs">
                    {health.database ? 'CONNECTED (Port 5432)' : 'OFFLINE (Memory-Mode)'}
                  </Badge>
                </div>
                <Separator className="border-border/30" />
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Demo Ingestion Engine:</span>
                  <span className="font-bold text-emerald-400">AVAILABLE</span>
                </div>
                <Separator className="border-border/30" />
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Daemon Build Version:</span>
                  <span className="font-bold text-foreground">{health.version || '1.0.0'}</span>
                </div>
              </div>
            ) : (
              <div className="flex items-center text-destructive text-xs gap-2 py-6 justify-center">
                <XCircle className="h-5 w-5" /> Daemon unreachable at http://localhost:8000
              </div>
            )}
          </CardContent>
        </Card>

        {/* Infrasound Acoustic Tuning */}
        <Card className="border-border/50 bg-card/80 shadow-lg">
          <CardHeader className="border-b border-border/40 pb-3">
            <CardTitle className="text-base font-mono flex items-center gap-2">
              <Sliders className="h-4 w-4 text-primary" /> Infrasound Instrument Calibration
            </CardTitle>
            <CardDescription className="text-xs font-mono">
              Sensitivity transfer factors and AI outlier thresholds
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6 space-y-4 font-mono text-xs">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">ADC Sensitivity Factor (Counts to Pa):</span>
                <span className="font-bold text-cyan-400">{sensitivityPreset} Pa/cnt</span>
              </div>
              <div className="flex gap-2">
                {[
                  { label: '0.00025 (Nominal Microbarometer)', val: '0.00025' },
                  { label: '0.00050 (High-Gain)', val: '0.00050' },
                ].map((s) => (
                  <button
                    key={s.val}
                    type="button"
                    onClick={() => setSensitivityPreset(s.val)}
                    className={`rounded border px-2.5 py-1 text-3xs font-mono transition-colors ${
                      sensitivityPreset === s.val
                        ? 'border-primary bg-primary/20 text-primary font-bold'
                        : 'border-border/40 bg-muted/20 text-muted-foreground hover:bg-muted/40'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            <Separator className="border-border/30" />

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">AI Contamination Factor (Outlier Ratio):</span>
                <span className="font-bold text-cyan-400">{anomalyContamination}</span>
              </div>
              <div className="flex gap-2">
                {[
                  { label: '0.01 (High Precision)', val: '0.01' },
                  { label: '0.05 (Balanced Standard)', val: '0.05' },
                  { label: '0.10 (High Sensitivity)', val: '0.10' },
                ].map((c) => (
                  <button
                    key={c.val}
                    type="button"
                    onClick={() => setAnomalyContamination(c.val)}
                    className={`rounded border px-2.5 py-1 text-3xs font-mono transition-colors ${
                      anomalyContamination === c.val
                        ? 'border-primary bg-primary/20 text-primary font-bold'
                        : 'border-border/40 bg-muted/20 text-muted-foreground hover:bg-muted/40'
                    }`}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            </div>

            <Separator className="border-border/30" />

            <div className="flex items-center justify-between text-muted-foreground pt-1">
              <span>Nyquist Cutoff:</span>
              <span className="font-bold text-foreground">20.0 Hz (Sample rate 40.0 Hz)</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Hardware Interface & Acquisition Architecture Card */}
      <Card className="border-border/50 bg-card/80 shadow-lg font-mono text-xs">
        <CardHeader className="border-b border-border/40 pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-mono flex items-center gap-2">
              <Cpu className="h-4 w-4 text-cyan-400" /> Physical Microbarometer Hardware Architecture
            </CardTitle>
            <Badge variant="outline" className="font-mono text-3xs border-cyan-400/40 text-cyan-400">
              0.01 – 20 Hz TARGET
            </Badge>
          </div>
          <CardDescription className="text-xs font-mono">
            Modular interface specifications for attaching physical digitizers and microbarometer assemblies
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 min-w-0">
            <div className="rounded border border-border/40 bg-muted/20 p-3 space-y-1.5">
              <span className="font-bold text-foreground">Serial Stream Adapter</span>
              <p className="text-3xs text-muted-foreground leading-relaxed">
                RS-232 / USB CDC COM port stream for microbarometers with onboard digitizers.
              </p>
              <Badge variant="outline" className="text-3xs font-mono">115200 BAUD</Badge>
            </div>
            <div className="rounded border border-border/40 bg-muted/20 p-3 space-y-1.5">
              <span className="font-bold text-foreground">Ethernet TCP / SeedLink</span>
              <p className="text-3xs text-muted-foreground leading-relaxed">
                Standard geophysical network stream protocol for remote field array digitizers.
              </p>
              <Badge variant="outline" className="text-3xs font-mono">PORT 18000</Badge>
            </div>
            <div className="rounded border border-border/40 bg-muted/20 p-3 space-y-1.5">
              <span className="font-bold text-foreground">24-Bit DAQ ADC</span>
              <p className="text-3xs text-muted-foreground leading-relaxed">
                Low-noise delta-sigma analog digitizer sampling differential pressure voltages (0-5V).
              </p>
              <Badge variant="outline" className="text-3xs font-mono">24-BIT DELTA-SIGMA</Badge>
            </div>
          </div>

          <Separator className="border-border/30" />

          <div className="rounded border border-amber-500/30 bg-amber-500/5 p-3 flex items-start gap-2.5">
            <Shield className="h-4 w-4 text-amber-400 flex-shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <span className="font-bold text-amber-400">Hardware Integration Roadmap Note:</span>
              <p className="text-3xs text-muted-foreground leading-relaxed">
                The software abstraction layer (<code>BaseSensorAdapter</code>) isolates sensor communications from the DSP pipeline.
                No physical digitizer is currently detected on local COM ports. The system operates in Standby mode for live sensors,
                with full functionality available for recorded volcanic/explosion datasets and demo streams.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

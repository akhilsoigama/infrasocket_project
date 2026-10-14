import { useState, useEffect, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Compass,
  Crosshair,
  ExternalLink,
  Gauge,
  Layers,
  LayoutGrid,
  List,
  MapPin,
  Radio,
  RefreshCw,
  Search,
  Signal,
  Sliders,
  Zap,
  Check,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PageHeader } from '@/components/common/PageHeader'
import { MetricTelemetryCard } from '@/components/scientific/MetricTelemetryCard'
import { api } from '@/services/api'
import { formatNumber } from '@/lib/utils'
import { useStationStore } from '@/stores/stationStore'
import { ROUTES } from '@/routes/routeConfig'

// Station metadata enrichment
interface StationMetadata {
  model: string
  transducer: string
  apertureKm: number
  relX: number
  relY: number
  channelName: string
  snrDb: number
}

const STATION_META: Record<string, StationMetadata> = {
  IMA1: {
    model: 'MB3d Microbarometer',
    transducer: 'Differential Pressure Transducer',
    apertureKm: 0.0,
    relX: 0,
    relY: 0,
    channelName: 'IMA Beirut - Reference Node',
    snrDb: 48.6,
  },
  IMA2: {
    model: 'MB3d Microbarometer',
    transducer: 'Differential Pressure Transducer',
    apertureKm: 0.85,
    relX: 0,
    relY: -65,
    channelName: 'IMA Beirut - North Satellite',
    snrDb: 47.2,
  },
  IMA3: {
    model: 'MB3d Microbarometer',
    transducer: 'Differential Pressure Transducer',
    apertureKm: 1.12,
    relX: 75,
    relY: 20,
    channelName: 'IMA Beirut - East Satellite',
    snrDb: 49.1,
  },
  IMA4: {
    model: 'MB3d Microbarometer',
    transducer: 'Differential Pressure Transducer',
    apertureKm: 0.94,
    relX: -55,
    relY: 50,
    channelName: 'IMA Beirut - West Satellite',
    snrDb: 46.8,
  },
  ENCR1: {
    model: 'Chaparral Model 25',
    transducer: 'Acoustic Enclosure Transducer',
    apertureKm: 3.4,
    relX: 40,
    relY: -40,
    channelName: 'ENCR External Reference Array',
    snrDb: 51.4,
  },
}

// Mini real-time waveform sparkline component
function StationWaveformSparkline({
  isAnomaly,
  seed = 1,
}: {
  isAnomaly: boolean
  seed?: number
}) {
  const [phase, setPhase] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setPhase((p) => (p + 1) % 100)
    }, 120)
    return () => clearInterval(timer)
  }, [])

  // Generate SVG path points
  const points = useMemo(() => {
    const width = 280
    const height = 36
    const midY = height / 2
    const pts: string[] = []

    for (let x = 0; x <= width; x += 5) {
      const t = (x / width) * 4 * Math.PI + (phase * 0.1)
      let y: number
      if (isAnomaly) {
        const envelope = Math.exp(-Math.pow((x - width / 2) / 48, 2))
        const wave = Math.sin(t * 1.8 + seed) * 14 * envelope + Math.sin(t * 3.5) * 3
        y = midY + wave
      } else {
        const wave = Math.sin(t * 0.8 + seed) * 3.5 + Math.cos(t * 1.6 + seed) * 2
        y = midY + wave
      }
      pts.push(`${x},${y.toFixed(1)}`)
    }
    return pts.join(' L ')
  }, [isAnomaly, phase, seed])

  return (
    <div className="relative rounded-lg border border-border/40 bg-black/50 overflow-hidden flex flex-col p-2 space-y-1.5 shadow-inner">
      {/* Background grid markings */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:16px_10px] pointer-events-none" />

      {/* Top telemetry info strip */}
      <div className="relative z-10 flex w-full items-center justify-between font-mono text-3xs">
        <span className="text-muted-foreground flex items-center gap-1.5">
          <span
            className={`h-1.5 w-1.5 rounded-full ${
              isAnomaly ? 'bg-rose-500 animate-ping' : 'bg-cyan-400'
            }`}
          />
          {isAnomaly ? 'OUTLIER TRANSIENT' : 'AMBIENT TRACE'}
        </span>
        <span
          className={`font-semibold px-1.5 py-0.5 rounded text-3xs ${
            isAnomaly
              ? 'bg-rose-950/80 text-rose-300 border border-rose-600/40'
              : 'bg-cyan-950/60 text-cyan-300 border border-cyan-800/40'
          }`}
        >
          {isAnomaly ? '±4.82 Pa PK' : '±0.03 Pa RMS'}
        </span>
      </div>

      {/* Waveform Canvas */}
      <div className="relative h-8 w-full">
        <div className="absolute left-0 right-0 top-1/2 h-px bg-border/20 pointer-events-none" />
        <svg
          viewBox="0 0 280 36"
          preserveAspectRatio="none"
          className="absolute inset-0 h-full w-full pointer-events-none"
        >
          <path
            d={`M ${points}`}
            fill="none"
            stroke={isAnomaly ? '#f43f5e' : '#38bdf8'}
            strokeWidth={isAnomaly ? '1.8' : '1.4'}
            strokeLinecap="round"
            strokeLinejoin="round"
            className={
              isAnomaly
                ? 'drop-shadow-[0_0_8px_rgba(244,63,94,0.7)]'
                : 'drop-shadow-[0_0_4px_rgba(56,189,248,0.4)]'
            }
          />
        </svg>
      </div>
    </div>
  )
}

export default function Stations() {
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState('')
  const [filterMode, setFilterMode] = useState<'all' | 'online' | 'anomalies'>('all')
  const [viewMode, setViewMode] = useState<'grid' | 'radar' | 'table'>('grid')
  const [selectedStationId, setSelectedStationId] = useState<string | null>(null)
  const { acknowledgedAnomalies, acknowledge } = useStationStore()

  // Polling station list from backend API
  const { data: stations, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['stations'],
    queryFn: api.getStations,
    refetchInterval: 10000,
  })

  // Check anomalies state across datasets
  const [anomalyStations, setAnomalyStations] = useState<Record<string, boolean>>({})

  useEffect(() => {
    let isMounted = true
    async function checkDatasetAnomalies() {
      try {
        const [imaRes, encrRes] = await Promise.all([
          fetch('http://localhost:8000/api/analytics/dataset/IMA')
            .then((r) => r.json())
            .catch(() => null),
          fetch('http://localhost:8000/api/analytics/dataset/ENCR1')
            .then((r) => r.json())
            .catch(() => null),
        ])

        if (!isMounted) return

        const hasImaAnomaly = !!(imaRes?.anomalies && imaRes.anomalies.length > 0)
        const hasEncrAnomaly = !!(encrRes?.anomalies && encrRes.anomalies.length > 0)

        setAnomalyStations({
          IMA1: hasImaAnomaly,
          IMA2: hasImaAnomaly,
          IMA3: false,
          IMA4: false,
          ENCR1: hasEncrAnomaly,
        })
      } catch {
        // Fallback default
      }
    }
    checkDatasetAnomalies()
    return () => {
      isMounted = false
    }
  }, [])

  // Filtered station list based on search and selected filter mode
  const filteredStations = useMemo(() => {
    if (!stations) return []
    return stations.filter((s) => {
      const matchesSearch =
        s.station_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.name.toLowerCase().includes(searchQuery.toLowerCase())

      if (!matchesSearch) return false

      const isAnomaly = anomalyStations[s.station_id] && !acknowledgedAnomalies[s.station_id]

      if (filterMode === 'online') return s.is_online
      if (filterMode === 'anomalies') return isAnomaly

      return true
    })
  }, [stations, searchQuery, filterMode, anomalyStations, acknowledgedAnomalies])

  const totalActiveTriggers = useMemo(() => {
    return Object.entries(anomalyStations).filter(
      ([id, isAnomaly]) => isAnomaly && !acknowledgedAnomalies[id]
    ).length
  }, [anomalyStations, acknowledgedAnomalies])

  return (
    <div className="flex h-full flex-col space-y-5 p-3 sm:p-5 lg:p-6 overflow-y-auto">
      {/* Page Header */}
      <PageHeader
        title="Infrasound Station Network"
        subtitle="ARRAY SPATIAL GEOMETRY • SENSOR TELEMETRY NODES • REAL-TIME PRESSURE TRANSDUCERS"
        badgeText={`${stations?.length || 5} PHYSICAL NODES`}
        badgeVariant="default"
      >
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
            className="gap-1.5 font-mono text-xs h-8"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isFetching ? 'animate-spin text-primary' : ''}`} />
            <span className="hidden sm:inline">Refresh Nodes</span>
          </Button>

          {/* View mode toggle */}
          <div className="flex rounded-md border border-border/60 bg-muted/30 p-0.5">
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded transition-colors ${
                viewMode === 'grid'
                  ? 'bg-primary text-primary-foreground font-bold shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
              title="Grid Card View"
            >
              <LayoutGrid className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('radar')}
              className={`p-1.5 rounded transition-colors ${
                viewMode === 'radar'
                  ? 'bg-primary text-primary-foreground font-bold shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
              title="Spatial Geometry Radar"
            >
              <Compass className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded transition-colors ${
                viewMode === 'table'
                  ? 'bg-primary text-primary-foreground font-bold shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
              title="Compact Matrix Table"
            >
              <List className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </PageHeader>

      {/* Network Overview Stats */}
      <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4">
        <MetricTelemetryCard
          label="Array Network"
          value="IMA Beirut + ENCR"
          subtext="33.89° N, 35.50° E Reference"
          icon={MapPin}
          tone="cyan"
        />
        <MetricTelemetryCard
          label="Active Transducers"
          value={stations?.filter((s) => s.is_online).length || 5}
          unit="Nodes"
          subtext="Sub-audible microbarometers"
          icon={Radio}
          tone="emerald"
        />
        <MetricTelemetryCard
          label="Array Aperture"
          value="1.24"
          unit="km"
          subtext="Cross-correlation baseline"
          icon={Crosshair}
          tone="default"
        />
        <MetricTelemetryCard
          label="Alert State"
          value={totalActiveTriggers > 0 ? `${totalActiveTriggers} Active Alerts` : 'Nominal Baseline'}
          subtext={
            totalActiveTriggers > 0
              ? 'Outlier acoustic wavefronts detected'
              : 'Ambient atmospheric noise'
          }
          icon={AlertTriangle}
          tone={totalActiveTriggers > 0 ? 'rose' : 'emerald'}
        />
      </div>

      {/* Search and Filter Control Bar */}
      <Card className="border-border/50 bg-card/60 backdrop-blur-sm shadow-md">
        <CardContent className="p-3 sm:p-4 flex flex-col md:flex-row gap-3 items-center justify-between">
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search station ID or sensor name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 font-mono text-xs h-8 bg-background/80"
            />
          </div>

          <div className="flex flex-wrap gap-2 w-full md:w-auto items-center">
            <button
              type="button"
              onClick={() => setFilterMode('all')}
              className={`rounded px-3 py-1.5 text-xs font-mono transition-all flex items-center gap-1.5 ${
                filterMode === 'all'
                  ? 'bg-primary text-primary-foreground font-bold shadow-sm'
                  : 'bg-muted/40 text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              All Nodes ({stations?.length || 5})
            </button>
            <button
              type="button"
              onClick={() => setFilterMode('online')}
              className={`rounded px-3 py-1.5 text-xs font-mono transition-all flex items-center gap-1.5 ${
                filterMode === 'online'
                  ? 'bg-emerald-500 text-white font-bold shadow-sm'
                  : 'bg-muted/40 text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              Online Only ({stations?.filter((s) => s.is_online).length || 5})
            </button>
            <button
              type="button"
              onClick={() => setFilterMode('anomalies')}
              className={`rounded px-3 py-1.5 text-xs font-mono transition-all flex items-center gap-1.5 ${
                filterMode === 'anomalies'
                  ? 'bg-destructive text-white font-bold shadow-[0_0_12px_rgba(239,68,68,0.4)]'
                  : totalActiveTriggers > 0
                  ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30 hover:bg-rose-500/20'
                  : 'bg-muted/40 text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              <AlertTriangle className="h-3 w-3" />
              Active Triggers ({totalActiveTriggers})
            </button>
          </div>
        </CardContent>
      </Card>

      {/* VIEW MODE 1: GRID CARDS VIEW */}
      {viewMode === 'grid' && (
        <div className="grid gap-4 sm:gap-6 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
          {isLoading ? (
            <div className="col-span-full flex h-48 flex-col items-center justify-center gap-3 font-mono text-xs text-muted-foreground">
              <RefreshCw className="h-6 w-6 animate-spin text-primary" />
              <span>Polling infrasound sensor nodes...</span>
            </div>
          ) : filteredStations.length === 0 ? (
            <div className="col-span-full flex h-48 flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border/60 bg-muted/10 p-6 text-center font-mono text-xs text-muted-foreground">
              <Radio className="h-8 w-8 text-muted-foreground/40" />
              <span>No matching array nodes found for current filter criteria.</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearchQuery('')
                  setFilterMode('all')
                }}
                className="text-xs text-primary"
              >
                Clear Filters
              </Button>
            </div>
          ) : (
            filteredStations.map((station, idx) => {
              const meta =
                STATION_META[station.station_id] || {
                  model: 'Infrasound Microbarometer',
                  transducer: 'Acoustic Sensor',
                  apertureKm: 1.0,
                  relX: 0,
                  relY: 0,
                  channelName: station.name,
                  snrDb: 48.0,
                }
              const isAnomaly =
                anomalyStations[station.station_id] && !acknowledgedAnomalies[station.station_id]
              const isSelected = selectedStationId === station.station_id

              return (
                <Card
                  key={station.station_id}
                  onClick={() => setSelectedStationId(station.station_id)}
                  className={`group relative flex flex-col justify-between overflow-hidden rounded-xl border transition-all duration-200 bg-card/90 backdrop-blur-md shadow-md hover:shadow-xl ${
                    isAnomaly
                      ? 'border-rose-500/70 shadow-[0_0_24px_rgba(244,63,94,0.18)] hover:border-rose-400'
                      : isSelected
                      ? 'border-primary ring-1 ring-primary/40 shadow-[0_0_20px_rgba(56,189,248,0.2)]'
                      : 'border-border/60 hover:border-primary/50'
                  }`}
                >
                  {/* Top Status Gradient Strip */}
                  <div
                    className={`h-1 w-full transition-all duration-300 ${
                      isAnomaly
                        ? 'bg-gradient-to-r from-rose-500 via-red-500 to-amber-500 animate-pulse'
                        : station.is_online
                        ? 'bg-gradient-to-r from-cyan-500/80 via-primary/60 to-emerald-500/80'
                        : 'bg-muted'
                    }`}
                  />

                  {/* Card Header with Balanced Two-Row Scientific Layout */}
                  <CardHeader className="p-4 sm:p-5 pb-3 border-b border-border/40 space-y-2">
                    {/* Row 1: Station ID + Transducer Model Badge on Left, Status Badges on Right */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-xl font-mono font-bold tracking-tight text-foreground">
                          {station.station_id}
                        </CardTitle>
                        <Badge
                          variant="outline"
                          className="font-mono text-3xs uppercase border-primary/30 text-primary px-1.5 py-0 bg-primary/5"
                        >
                          {meta.model.split(' ')[0]}
                        </Badge>
                      </div>

                      {/* Status Badges Row (Uniform Height & Alignment across all cards) */}
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        {isAnomaly && (
                          <Badge
                            variant="destructive"
                            className="font-mono text-3xs font-semibold px-2 py-0.5 animate-pulse bg-rose-500/20 text-rose-300 border border-rose-500/50 shadow-sm"
                          >
                            OUTLIER WAVE
                          </Badge>
                        )}
                        <Badge
                          variant={station.is_online ? 'success' : 'secondary'}
                          className={`font-mono text-3xs px-2 py-0.5 flex items-center gap-1.5 ${
                            station.is_online
                              ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                              : 'bg-muted text-muted-foreground'
                          }`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${
                              station.is_online ? 'bg-emerald-400 animate-pulse' : 'bg-muted-foreground'
                            }`}
                          />
                          {station.is_online ? 'ONLINE' : 'OFFLINE'}
                        </Badge>
                      </div>
                    </div>

                    {/* Row 2: Channel Subtitle with Full Width */}
                    <div className="flex items-center justify-between text-xs font-mono text-muted-foreground">
                      <span className="truncate pr-2">{meta.channelName}</span>
                      <span className="text-3xs text-muted-foreground/60 flex-shrink-0">CH-0{idx + 1}</span>
                    </div>
                  </CardHeader>

                  {/* Card Body */}
                  <CardContent className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-3.5 font-mono text-xs">
                    {/* Live Microbarograph Waveform Sparkline */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-3xs text-muted-foreground px-0.5">
                        <span className="flex items-center gap-1">
                          <Activity className="h-3 w-3 text-primary" /> Live Pressure Waveform
                        </span>
                        <span>0.01 - 20.0 Hz</span>
                      </div>
                      <StationWaveformSparkline isAnomaly={isAnomaly} seed={idx + 1} />
                    </div>

                    {/* Signal Quality & Channel Health Meter */}
                    <div className="space-y-1.5 rounded-lg border border-border/40 bg-muted/20 p-2.5">
                      <div className="flex items-center justify-between text-2xs">
                        <span className="flex items-center text-muted-foreground">
                          <Signal className="mr-1.5 h-3.5 w-3.5 text-emerald-400" /> Channel Health
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-3xs text-muted-foreground">SNR: {meta.snrDb} dB</span>
                          <span className="font-bold text-emerald-400">
                            {formatNumber(station.signal_quality, 1)}%
                          </span>
                        </div>
                      </div>
                      <div className="h-1.5 w-full bg-muted/60 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-emerald-500 to-cyan-400 rounded-full transition-all duration-300"
                          style={{ width: `${station.signal_quality}%` }}
                        />
                      </div>
                    </div>

                    {/* Technical Telemetry Grid (2x2 Matrix) */}
                    <div className="grid grid-cols-2 gap-2 text-2xs rounded-lg border border-border/30 bg-background/50 p-2.5">
                      <div className="space-y-0.5">
                        <span className="text-muted-foreground flex items-center gap-1">
                          <Radio className="h-3 w-3 text-primary" /> Sampling Rate
                        </span>
                        <p className="font-semibold text-foreground text-xs">{station.sample_rate} Hz</p>
                      </div>

                      <div className="space-y-0.5">
                        <span className="text-muted-foreground flex items-center gap-1">
                          <Gauge className="h-3 w-3 text-amber-400" /> Elevation
                        </span>
                        <p className="font-semibold text-foreground text-xs">{station.elevation} m MSL</p>
                      </div>

                      <div className="space-y-0.5 col-span-2 pt-1 border-t border-border/20">
                        <span className="text-muted-foreground flex items-center gap-1">
                          <MapPin className="h-3 w-3 text-cyan-400" /> GPS Geolocation
                        </span>
                        <p className="font-semibold text-foreground text-xs">
                          {formatNumber(station.latitude, 4)}° N, {formatNumber(station.longitude, 4)}° E
                        </p>
                      </div>

                      <div className="space-y-0.5 col-span-2 pt-1 border-t border-border/20">
                        <span className="text-muted-foreground flex items-center gap-1">
                          <Crosshair className="h-3 w-3 text-primary" /> Array Baseline
                        </span>
                        <p className="text-xs text-muted-foreground">
                          {meta.apertureKm > 0
                            ? `+${meta.apertureKm.toFixed(2)} km offset from origin`
                            : 'Array Origin Reference (0, 0)'}
                        </p>
                      </div>
                    </div>

                    {/* Action Buttons Footer */}
                    <div className="pt-1 flex items-center gap-2">
                      <Button
                        variant="default"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          navigate(`${ROUTES.LIVE_MONITORING}?station=${station.station_id}`)
                        }}
                        className="flex-1 text-xs font-mono gap-1.5 h-8 bg-primary/90 hover:bg-primary text-primary-foreground shadow-sm"
                      >
                        <ExternalLink className="h-3 w-3" /> Live Oscilloscope
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          navigate(ROUTES.SIGNAL_ANALYSIS)
                        }}
                        className="text-xs font-mono h-8 px-2.5 border-border/60 hover:border-primary/60 hover:text-cyan-400"
                        title="Open Signal Analysis (FFT & Spectrogram)"
                      >
                        <Zap className="h-3.5 w-3.5 text-cyan-400" />
                      </Button>

                      {isAnomaly && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            acknowledge(station.station_id)
                          }}
                          className="text-xs font-mono h-8 px-2.5 border-rose-500/50 text-rose-400 hover:bg-rose-500/20"
                          title="Acknowledge Outlier Wavefront"
                        >
                          <Check className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )
            })
          )}
        </div>
      )}

      {/* VIEW MODE 2: SPATIAL RADAR ARRAY VIEW */}
      {viewMode === 'radar' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2 border-border/50 bg-card/85 shadow-xl flex flex-col min-h-[480px]">
            <CardHeader className="border-b border-border/40 pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base font-mono flex items-center gap-2">
                    <Compass className="h-4 w-4 text-cyan-400 animate-spin" style={{ animationDuration: '24s' }} />
                    Array Geometry & Beamforming Radar
                  </CardTitle>
                  <CardDescription className="text-xs font-mono">
                    Spatial placement of microbarometer elements relative to array centroid
                  </CardDescription>
                </div>
                <Badge variant="outline" className="font-mono text-3xs border-primary/40 text-primary">
                  BEIRUT ARRAY (IMA)
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="flex-1 flex items-center justify-center p-6 relative">
              {/* Radar Graphic Canvas */}
              <div className="relative w-72 h-72 sm:w-96 sm:h-96 rounded-full border border-border/60 bg-[#05080f] flex items-center justify-center overflow-hidden shadow-2xl">
                {/* Radar sweep beam animation */}
                <div
                  className="absolute inset-0 origin-center pointer-events-none rounded-full"
                  style={{
                    background:
                      'conic-gradient(from 0deg at 50% 50%, rgba(56,189,248,0.18) 0deg, rgba(56,189,248,0.02) 60deg, transparent 65deg)',
                    animation: 'spin 8s linear infinite',
                  }}
                />

                {/* Concentric distance rings */}
                <div className="absolute w-3/4 h-3/4 rounded-full border border-cyan-500/20" />
                <div className="absolute w-1/2 h-1/2 rounded-full border border-cyan-500/20" />
                <div className="absolute w-1/4 h-1/4 rounded-full border border-cyan-500/25" />

                {/* Crosshairs */}
                <div className="absolute w-full h-px bg-cyan-500/20" />
                <div className="absolute h-full w-px bg-cyan-500/20" />

                {/* Distance Ring Labels */}
                <span className="absolute top-[13%] left-1/2 -translate-x-1/2 text-3xs font-mono text-cyan-400/60">
                  1.5 km
                </span>
                <span className="absolute top-[26%] left-1/2 -translate-x-1/2 text-3xs font-mono text-cyan-400/60">
                  1.0 km
                </span>
                <span className="absolute top-[38%] left-1/2 -translate-x-1/2 text-3xs font-mono text-cyan-400/60">
                  0.5 km
                </span>

                {/* Cardinal direction labels */}
                <span className="absolute top-2 text-2xs font-mono text-cyan-300 font-bold">N (0°)</span>
                <span className="absolute bottom-2 text-2xs font-mono text-cyan-300 font-bold">S (180°)</span>
                <span className="absolute right-2 text-2xs font-mono text-cyan-300 font-bold">E (90°)</span>
                <span className="absolute left-2 text-2xs font-mono text-cyan-300 font-bold">W (270°)</span>

                {/* Center marker / Array Origin */}
                <div className="h-2.5 w-2.5 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(56,189,248,0.8)] z-10" />

                {/* Plot each sensor node */}
                {stations?.map((station) => {
                  const meta = STATION_META[station.station_id] || { relX: 0, relY: 0 }
                  const isAnomaly =
                    anomalyStations[station.station_id] && !acknowledgedAnomalies[station.station_id]
                  const isSelected = selectedStationId === station.station_id

                  return (
                    <div
                      key={station.station_id}
                      onClick={() => setSelectedStationId(station.station_id)}
                      style={{
                        transform: `translate(${meta.relX}px, ${meta.relY}px)`,
                      }}
                      className="absolute z-20 cursor-pointer group flex flex-col items-center transition-transform hover:scale-125"
                    >
                      <div
                        className={`h-4 w-4 rounded-full border-2 flex items-center justify-center shadow-lg transition-all ${
                          isAnomaly
                            ? 'bg-rose-500 border-white shadow-[0_0_12px_rgba(244,63,94,0.8)] animate-pulse'
                            : isSelected
                            ? 'bg-cyan-400 border-white ring-4 ring-cyan-400/30'
                            : 'bg-emerald-500 border-background'
                        }`}
                      />
                      <span
                        className={`mt-1 rounded px-1.5 py-0.5 text-3xs font-mono font-bold shadow border ${
                          isAnomaly
                            ? 'bg-rose-950/90 text-rose-300 border-rose-500/60'
                            : isSelected
                            ? 'bg-cyan-950/90 text-cyan-300 border-cyan-500/60'
                            : 'bg-background/90 text-foreground border-border/60'
                        }`}
                      >
                        {station.station_id}
                      </span>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          {/* Radar Sidebar Inspector */}
          <Card className="border-border/50 bg-card/85 shadow-xl flex flex-col">
            <CardHeader className="border-b border-border/40 pb-3">
              <CardTitle className="text-base font-mono">Array Node Inspector</CardTitle>
              <CardDescription className="text-xs font-mono">
                Click any sensor node on radar to inspect details
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 space-y-4 font-mono text-xs flex-1">
              {selectedStationId ? (
                (() => {
                  const st = stations?.find((s) => s.station_id === selectedStationId)
                  const meta = STATION_META[selectedStationId]
                  if (!st) return null

                  const isAnomaly =
                    anomalyStations[selectedStationId] && !acknowledgedAnomalies[selectedStationId]

                  return (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-lg font-bold text-cyan-400">{st.station_id}</span>
                          {isAnomaly && (
                            <Badge variant="destructive" className="text-3xs animate-pulse">
                              OUTLIER
                            </Badge>
                          )}
                        </div>
                        <Badge variant="outline" className="border-primary/40 text-primary">
                          {st.sample_rate} Hz
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">{st.name}</p>

                      <div className="rounded border border-border/40 bg-muted/20 p-3 space-y-2">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Transducer:</span>
                          <span className="font-semibold text-foreground text-right">
                            {meta?.model}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">GPS Location:</span>
                          <span>
                            {st.latitude.toFixed(4)}°, {st.longitude.toFixed(4)}°
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Elevation:</span>
                          <span>{st.elevation} m MSL</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Baseline Offset:</span>
                          <span>
                            {meta?.apertureKm > 0 ? `+${meta.apertureKm.toFixed(2)} km` : 'Origin Reference'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Signal Quality:</span>
                          <span className="text-emerald-400 font-bold">{st.signal_quality}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">SNR:</span>
                          <span className="text-cyan-400 font-bold">{meta?.snrDb} dB</span>
                        </div>
                      </div>

                      <Button
                        variant="default"
                        size="sm"
                        className="w-full text-xs font-mono gap-1.5"
                        onClick={() => navigate(`${ROUTES.LIVE_MONITORING}?station=${st.station_id}`)}
                      >
                        <ExternalLink className="h-3.5 w-3.5" /> Open in Live Oscilloscope
                      </Button>
                    </div>
                  )
                })()
              ) : (
                <div className="flex h-56 flex-col items-center justify-center text-muted-foreground text-center">
                  <Crosshair className="h-8 w-8 mb-2 opacity-30 text-primary" />
                  <p>Select a node on the radar geometry map to inspect telemetry specs.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* VIEW MODE 3: COMPACT TABLE MATRIX VIEW */}
      {viewMode === 'table' && (
        <Card className="border-border/50 bg-card/85 shadow-xl overflow-hidden">
          <CardHeader className="border-b border-border/40 pb-3">
            <CardTitle className="text-base font-mono">Sensor Telemetry Matrix</CardTitle>
            <CardDescription className="text-xs font-mono">
              Raw station parameters, sampling rates, and network telemetry
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0 overflow-x-auto">
            <div className="min-w-[760px] divide-y divide-border/20 font-mono text-xs">
              <div className="grid grid-cols-7 bg-muted/40 p-3 font-bold text-muted-foreground">
                <div>Station ID</div>
                <div>Sensor Model</div>
                <div>Sample Rate</div>
                <div>Signal Health</div>
                <div>SNR (dB)</div>
                <div>Coordinates (GPS)</div>
                <div className="text-right">Actions</div>
              </div>

              {filteredStations.map((s) => {
                const isAnomaly =
                  anomalyStations[s.station_id] && !acknowledgedAnomalies[s.station_id]
                const meta = STATION_META[s.station_id]

                return (
                  <div
                    key={s.station_id}
                    className="grid grid-cols-7 items-center p-3 hover:bg-muted/20 transition-colors"
                  >
                    <div className="font-bold text-foreground flex items-center gap-2">
                      <span
                        className={`h-2 w-2 rounded-full ${
                          isAnomaly ? 'bg-rose-500 animate-pulse' : 'bg-emerald-400'
                        }`}
                      />
                      {s.station_id}
                      {isAnomaly && (
                        <Badge variant="destructive" className="text-3xs py-0 px-1">
                          ALERT
                        </Badge>
                      )}
                    </div>
                    <div className="text-muted-foreground truncate">
                      {meta?.model || 'Microbarometer'}
                    </div>
                    <div className="text-cyan-400 font-bold">{s.sample_rate} Hz</div>
                    <div>
                      <span className="text-emerald-400 font-semibold">{s.signal_quality}%</span>
                    </div>
                    <div className="text-foreground">{meta?.snrDb || 48.0} dB</div>
                    <div className="text-muted-foreground">
                      {s.latitude.toFixed(3)}°, {s.longitude.toFixed(3)}°
                    </div>
                    <div className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate(`${ROUTES.LIVE_MONITORING}?station=${s.station_id}`)}
                        className="text-xs h-7 text-primary hover:text-primary"
                      >
                        View Live
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

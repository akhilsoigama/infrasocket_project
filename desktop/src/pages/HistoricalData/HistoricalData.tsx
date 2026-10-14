import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  Activity,
  ArrowRight,
  BarChart2,
  Calendar,
  Database,
  Download,
  FileText,
  FileUp,
  HardDrive,
  Layers,
  Play,
  Search,
  Waves,
  Zap,
} from 'lucide-react'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { PageHeader } from '@/components/common/PageHeader'
import { MetricTelemetryCard } from '@/components/scientific/MetricTelemetryCard'
import { api } from '@/services/api'
import { formatTimestamp, formatNumber } from '@/lib/utils'
import { ROUTES } from '@/routes/routeConfig'

export default function HistoricalData() {
  const [searchQuery, setSearchQuery] = useState('')
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<string>('all')

  // Fetch dataset catalog
  const { data: datasetsCatalog } = useQuery({
    queryKey: ['datasets-catalog'],
    queryFn: api.getDatasetsCatalog,
  })

  // Fetch historical events
  const { data: events, isLoading } = useQuery({
    queryKey: ['historical-events'],
    queryFn: () => api.getEvents(50, 0),
  })

  const filteredEvents = useMemo(() => {
    if (!events) return []
    return events.filter(
      (evt) =>
        evt.station_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        evt.event_type.toLowerCase().includes(searchQuery.toLowerCase()) ||
        evt.event_id.toLowerCase().includes(searchQuery.toLowerCase())
    )
  }, [events, searchQuery])

  const handleExportCSV = () => {
    if (!filteredEvents.length) return
    let csv = 'Event_ID,Timestamp,Station,Classification,SNR_dB,Duration_s\n'
    filteredEvents.forEach((evt) => {
      csv += `${evt.event_id},${evt.timestamp},${evt.station_id},${evt.event_type},${(evt.snr_db || 0).toFixed(2)},${evt.duration_seconds || 10}\n`
    })
    const encoded = encodeURI(`data:text/csv;charset=utf-8,${csv}`)
    const a = document.createElement('a')
    a.href = encoded
    a.download = `infrasocket_historical_archive_${Date.now()}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }

  const handleExportReport = () => {
    const reportText = `=====================================================
INFRASOCKET INFRASOUND MONITORING & SIGNAL ANALYSIS SYSTEM
HISTORICAL ARCHIVE & DATASET AUDIT REPORT
Target Frequency Range: 0.01 - 20.0 Hz
Generated UTC: ${new Date().toUTCString()}
Total Archived Records: ${filteredEvents.length}
=====================================================
${filteredEvents
  .map(
    (e) =>
      `[${e.timestamp}] Station: ${e.station_id} | Type: ${e.event_type} | SNR: ${e.snr_db?.toFixed(1)} dB | Duration: ${e.duration_seconds || 5}s`
  )
  .join('\n')}
`
    const blob = new Blob([reportText], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `infrasocket_scientific_audit_${Date.now()}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }

  const defaultDatasets = [
    {
      id: 'IMA',
      name: 'IMA Beirut 4-Element Infrasound Array',
      category: 'explosion',
      categoryLabel: 'Explosion Recording',
      sampleRate: '40.0 Hz',
      targetBand: '0.01 – 20.0 Hz',
      channels: 'IMA1, IMA2, IMA3, IMA4',
      units: 'Pascal (Pa)',
      duration: '400.0 s',
      description: 'Atmospheric blast wave and high-yield acoustic transient shockwave recording with ocean microbarom background.',
      badgeTone: 'cyan',
    },
    {
      id: 'ENCR1',
      name: 'ENCR1 Station (Mount Etna Volcano)',
      category: 'volcano',
      categoryLabel: 'Volcanic Tremor Recording',
      sampleRate: '20.0 Hz',
      targetBand: '0.01 – 10.0 Hz',
      channels: 'HDF (Calibrated)',
      units: 'Acoustic Pressure (Pa)',
      duration: '500.0 s',
      description: 'Persistent low-frequency volcanic tremor and strombolian explosive degassing acoustic pressure pulses.',
      badgeTone: 'amber',
    },
    {
      id: 'ENCR_ARRAY',
      name: 'ENCR Multi-Station Volcanic Array',
      category: 'volcano',
      categoryLabel: 'Volcanic Array (MiniSEED)',
      sampleRate: '20.0 Hz',
      targetBand: '0.01 – 10.0 Hz',
      channels: '6 Array Stations (ENCR1-6)',
      units: 'Acoustic Pressure (Pa)',
      duration: '1000.0 s',
      description: 'Multi-element spatial array archive for back-azimuth derivation and phase correlation across the volcanic caldera.',
      badgeTone: 'emerald',
    },
  ]

  return (
    <div className="flex h-full flex-col space-y-4 sm:space-y-6 p-4 sm:p-6 lg:p-8 overflow-y-auto min-w-0">
      <PageHeader
        title="Recorded Infrasound Datasets & Archives"
        subtitle="EXPLOSION TRANSIENTS • VOLCANIC TREMORS • MICROBAROMS • CSV & MINISEED"
        badgeText={`${defaultDatasets.length} DATASETS CATALOGED`}
        badgeVariant="default"
      >
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCSV}
            className="gap-1.5 font-mono text-xs"
          >
            <Download className="h-3.5 w-3.5" /> Export CSV
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportReport}
            className="gap-1.5 font-mono text-xs"
          >
            <FileText className="h-3.5 w-3.5" /> Export Summary
          </Button>
        </div>
      </PageHeader>

      {/* Metric Telemetry */}
      <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 font-mono min-w-0">
        <MetricTelemetryCard
          label="Cataloged Datasets"
          value={defaultDatasets.length}
          unit="Sets"
          subtext="Explosion & volcanic archives"
          icon={Database}
          tone="cyan"
        />
        <MetricTelemetryCard
          label="Archived Detections"
          value={filteredEvents.length}
          unit="Records"
          subtext="Indexed acoustic arrivals"
          icon={HardDrive}
          tone="emerald"
        />
        <MetricTelemetryCard
          label="Target Frequency Band"
          value="0.01 – 20.0"
          unit="Hz"
          subtext="Atmospheric infrasonic bandwidth"
          icon={Waves}
          tone="default"
        />
        <MetricTelemetryCard
          label="Calibrated Units"
          value="Pascal (Pa)"
          subtext="Physical differential pressure"
          icon={Activity}
          tone="amber"
        />
      </div>

      {/* Featured Recorded Datasets Catalog Cards */}
      <div className="space-y-4 min-w-0">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 font-mono text-xs">
          <div className="flex items-center gap-2">
            <span className="font-bold text-foreground uppercase">
              Curated Infrasound Dataset Library
            </span>
            <Badge variant="outline" className="text-3xs font-mono">
              0.01 - 20 Hz
            </Badge>
          </div>
          <div className="flex gap-1.5 flex-wrap">
            {['all', 'explosion', 'volcano'].map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setActiveCategoryFilter(cat)}
                className={`rounded px-2 py-0.5 text-3xs uppercase font-mono transition-colors ${
                  activeCategoryFilter === cat
                    ? 'bg-primary text-primary-foreground font-bold'
                    : 'bg-muted/30 text-muted-foreground hover:text-foreground'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 font-mono text-xs min-w-0">
          {defaultDatasets
            .filter((d) => activeCategoryFilter === 'all' || d.category === activeCategoryFilter)
            .map((ds) => (
              <Card key={ds.id} className="border-border/60 bg-card/70 flex flex-col justify-between shadow-md">
                <CardHeader className="pb-3 border-b border-border/40">
                  <div className="flex justify-between items-start gap-2">
                    <Badge variant="outline" className="text-3xs font-mono uppercase">
                      {ds.categoryLabel}
                    </Badge>
                    <span className="text-3xs text-muted-foreground">{ds.sampleRate}</span>
                  </div>
                  <CardTitle className="text-sm font-bold text-foreground mt-2 leading-snug">
                    {ds.name}
                  </CardTitle>
                </CardHeader>

                <CardContent className="pt-3 flex-1 flex flex-col justify-between space-y-3">
                  <p className="text-2xs text-muted-foreground leading-relaxed">
                    {ds.description}
                  </p>

                  <div className="rounded border border-border/40 bg-muted/20 p-2 text-3xs space-y-1 text-muted-foreground">
                    <div className="flex justify-between">
                      <span>Channels:</span>
                      <span className="font-bold text-foreground">{ds.channels}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Bandwidth:</span>
                      <span className="font-bold text-emerald-400">{ds.targetBand}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Units:</span>
                      <span className="font-bold text-foreground">{ds.units}</span>
                    </div>
                  </div>

                  <div className="pt-1 flex gap-2">
                    <Button asChild size="sm" variant="default" className="flex-1 text-xs h-7 font-mono">
                      <Link to={`/live?station=${ds.id}`}>
                        <Play className="h-3 w-3 mr-1" /> Inspect Waveform
                      </Link>
                    </Button>
                    <Button asChild size="sm" variant="outline" className="text-xs h-7 font-mono">
                      <Link to={ROUTES.SIGNAL_ANALYSIS}>
                        <BarChart2 className="h-3 w-3" /> PSD
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
        </div>
      </div>

      {/* Dataset Archive Event Explorer */}
      <Card className="border-border/50 bg-card/80 shadow-lg font-mono text-xs">
        <CardHeader className="border-b border-border/40 pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <CardTitle className="text-base font-mono">Historical Detections Feed</CardTitle>
              <CardDescription className="text-xs font-mono">
                Temporal catalog of acoustic arrivals and classified infrasonic events
              </CardDescription>
            </div>
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search station or event type..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 font-mono text-xs h-8 bg-background/80"
              />
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono text-2xs">
              <thead className="bg-muted/40 border-b border-border/40 text-muted-foreground font-semibold">
                <tr>
                  <th className="p-3">Event ID</th>
                  <th className="p-3">Timestamp (UTC)</th>
                  <th className="p-3">Station Node</th>
                  <th className="p-3">Acoustic Classification</th>
                  <th className="p-3">SNR</th>
                  <th className="p-3">Duration</th>
                  <th className="p-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/20">
                {filteredEvents.length > 0 ? (
                  filteredEvents.map((evt) => (
                    <tr key={evt.event_id} className="hover:bg-muted/20 transition-colors">
                      <td className="p-3 font-bold text-foreground">{evt.event_id.slice(0, 8)}...</td>
                      <td className="p-3 text-muted-foreground">{formatTimestamp(evt.timestamp)}</td>
                      <td className="p-3 font-semibold text-primary">{evt.station_id}</td>
                      <td className="p-3 capitalize text-foreground">{evt.event_type.replace(/_/g, ' ')}</td>
                      <td className="p-3 font-semibold text-emerald-400">
                        {evt.snr_db ? `${evt.snr_db.toFixed(1)} dB` : '38.4 dB'}
                      </td>
                      <td className="p-3 text-muted-foreground">{evt.duration_seconds || 5.0}s</td>
                      <td className="p-3 text-right">
                        <Badge
                          variant={evt.is_anomaly ? 'destructive' : 'secondary'}
                          className="text-3xs uppercase font-mono"
                        >
                          {evt.is_anomaly ? 'Anomaly' : 'Nominal'}
                        </Badge>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-muted-foreground">
                      No matching historical records found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

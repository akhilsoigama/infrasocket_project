import { useState, useMemo } from 'react'
import { AlertCircle, AlertTriangle, Download, Filter, Search, Zap } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { PageHeader } from '@/components/common/PageHeader'
import { MetricTelemetryCard } from '@/components/scientific/MetricTelemetryCard'

import { api } from '@/services/api'
import { useEventStore } from '@/stores/eventStore'
import { formatNumber, formatTimestamp } from '@/lib/utils'

export default function Events() {
  const [filterType, setFilterType] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const pageSize = 50

  // Real-time events from WebSocket store
  const realtimeEvents = useEventStore((state) => state.events)

  // Fetch historical events
  const { data: historicalEvents, isLoading } = useQuery({
    queryKey: ['events'],
    queryFn: () => api.getEvents(pageSize, 0),
    refetchInterval: 10000,
  })

  // Combine real-time and historical events, deduplicating by ID
  const allEvents = useMemo(() => {
    return Array.from(
      new Map(
        [...(realtimeEvents || []), ...(historicalEvents || [])].map((item) => [item.event_id, item])
      ).values()
    ).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
  }, [realtimeEvents, historicalEvents])

  // Filtered events
  const filteredEvents = useMemo(() => {
    return allEvents.filter((evt) => {
      const matchesSearch =
        evt.station_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        evt.event_type.toLowerCase().includes(searchQuery.toLowerCase()) ||
        evt.event_id.toLowerCase().includes(searchQuery.toLowerCase())

      if (!matchesSearch) return false

      if (filterType === 'anomalies') return evt.is_anomaly
      if (filterType === 'normal') return !evt.is_anomaly
      if (filterType !== 'all') return evt.event_type.toLowerCase().includes(filterType.toLowerCase())

      return true
    })
  }, [allEvents, searchQuery, filterType])

  const anomalyCount = allEvents.filter((e) => e.is_anomaly).length

  // CSV export
  const handleExportCSV = () => {
    let csv = 'Event_ID,Timestamp,Station,Classification,Confidence,Anomaly_Score,Is_Anomaly\n'
    filteredEvents.forEach((e) => {
      csv += `${e.event_id},${e.timestamp},${e.station_id},${e.event_type},${(e.confidence || 0).toFixed(2)},${(e.predictions?.[0]?.anomaly_score ?? 0).toFixed(4)},${e.is_anomaly ? 'TRUE' : 'FALSE'}\n`
    })
    const encoded = encodeURI(`data:text/csv;charset=utf-8,${csv}`)
    const a = document.createElement('a')
    a.href = encoded
    a.download = `infrasound_events_${Date.now()}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }

  return (
    <div className="flex h-full flex-col space-y-4 sm:space-y-6 p-4 sm:p-6 lg:p-8 overflow-y-auto min-w-0">
      <PageHeader
        title="Infrasonic Event Catalog"
        subtitle="CONTINUOUS ARRIVAL DETECTION • RULE-BASED ACOUSTIC ANALYSIS • OUTLIER AUDIT"
        badgeText={`${filteredEvents.length} ARRIVALS LOGGED`}
        badgeVariant="default"
      >
        <Button
          variant="outline"
          size="sm"
          onClick={handleExportCSV}
          className="gap-1.5 font-mono text-xs"
        >
          <Download className="h-3.5 w-3.5" />
          Export CSV
        </Button>
      </PageHeader>

      {/* Scientific Notice Banner */}
      <div className="rounded-lg border border-border/50 bg-card/60 p-3 font-mono text-xs text-muted-foreground flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <span>Analysis Methodology: <strong>Rule-based signal thresholds & Isolation Forest statistical scoring</strong></span>
        <Badge variant="outline" className="text-3xs font-mono shrink-0">0.01 - 20 Hz Catalog</Badge>
      </div>

      {/* Summary Telemetry */}
      <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 min-w-0">
        <MetricTelemetryCard
          label="Total Cataloged"
          value={allEvents.length}
          unit="Events"
          subtext="Full acquisition session"
          icon={Zap}
          tone="cyan"
        />
        <MetricTelemetryCard
          label="Flagged Anomalies"
          value={anomalyCount}
          unit="Detections"
          subtext="Isolation Forest outlier triggers"
          icon={AlertTriangle}
          tone="rose"
        />
        <MetricTelemetryCard
          label="Nominal Arrivals"
          value={allEvents.length - anomalyCount}
          unit="Events"
          subtext="Background & microbarom noise"
          icon={AlertCircle}
          tone="emerald"
        />
        <MetricTelemetryCard
          label="Active Filter"
          value={filteredEvents.length}
          unit="Shown"
          subtext={`Query: "${filterType}"`}
          icon={Filter}
          tone="amber"
        />
      </div>

      {/* Filter and Search Bar */}
      <Card className="border-border/50 bg-card/60 backdrop-blur-sm min-w-0">
        <CardContent className="p-4 flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between min-w-0">
          <div className="relative w-full lg:w-80">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search station, type, or event ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 font-mono text-xs bg-background/80"
            />
          </div>

          <div className="flex flex-wrap gap-2 w-full md:w-auto">
            {['all', 'anomalies', 'normal', 'explosion', 'volcano', 'microbarom', 'meteor', 'unclassified'].map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFilterType(f)}
                className={`rounded px-2.5 py-1 text-xs font-mono capitalize transition-colors ${
                  filterType === f
                    ? 'bg-primary text-primary-foreground font-bold shadow-sm'
                    : 'bg-muted/40 text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Events Table */}
      <Card className="flex-1 overflow-hidden flex flex-col border-border/50 bg-card/80 shadow-xl min-h-[400px] min-w-0">
        <CardHeader className="border-b border-border/40 pb-3">
          <CardTitle className="text-base font-mono">Detection Phase Records</CardTitle>
          <CardDescription className="text-xs font-mono">
            Chronological arrival sequence with rule-based acoustic heuristic confidence
          </CardDescription>
        </CardHeader>

        <CardContent className="flex-1 overflow-x-auto min-w-0 p-0">
          <Table>
            <TableHeader className="bg-muted/40 sticky top-0 z-10 font-mono text-xs">
              <TableRow className="border-border/40">
                <TableHead>UTC Timestamp</TableHead>
                <TableHead>Station Code</TableHead>
                <TableHead>Signature Classification</TableHead>
                <TableHead>Classifier Conf.</TableHead>
                <TableHead>Anomaly Outlier Score</TableHead>
                <TableHead className="text-right">Audit Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="font-mono text-xs divide-y divide-border/20">
              {isLoading && allEvents.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-28 text-center text-muted-foreground">
                    Synchronizing detection logs...
                  </TableCell>
                </TableRow>
              ) : filteredEvents.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-28 text-center text-muted-foreground">
                    No detections match current filter parameters.
                  </TableCell>
                </TableRow>
              ) : (
                filteredEvents.map((event) => (
                  <TableRow key={event.event_id} className="hover:bg-muted/20 border-border/20">
                    <TableCell className="text-muted-foreground">
                      {formatTimestamp(event.timestamp)}
                    </TableCell>
                    <TableCell className="font-bold text-foreground">
                      {event.station_id}
                    </TableCell>
                    <TableCell className="capitalize font-semibold">
                      {event.event_type.replace(/_/g, ' ')}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span>{formatNumber((event.confidence || 0) * 100, 1)}%</span>
                        <div className="w-12 h-1 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary"
                            style={{ width: `${(event.confidence || 0) * 100}%` }}
                          />
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-muted-foreground">
                      {formatNumber(event.predictions?.[0]?.anomaly_score ?? (event.is_anomaly ? 0.38 : -0.12), 4)}
                    </TableCell>
                    <TableCell className="text-right">
                      {event.is_anomaly ? (
                        <Badge variant="destructive" className="gap-1 font-mono text-3xs uppercase">
                          <AlertTriangle className="h-3 w-3" /> Anomaly
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="gap-1 font-mono text-3xs uppercase">
                          <AlertCircle className="h-3 w-3" /> Nominal
                        </Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

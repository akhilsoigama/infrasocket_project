import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Activity, AlertTriangle, Play, Radio, StopCircle } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'

import { api } from '@/services/api'
import { useDemoStore } from '@/stores/demoStore'
import { formatNumber, formatTimestamp } from '@/lib/utils'
import { useRealtimeSignal } from '@/hooks/useRealtimeSignal'
import { useEventStore } from '@/stores/eventStore'
import { useSignalStore } from '@/stores/signalStore'

export default function Overview() {
  useRealtimeSignal()
  
  const { isRunning, setStatus } = useDemoStore()
  const latestEvents = useEventStore((state) => state.events.slice(0, 5))
  const metrics = useSignalStore((state) => state.metrics)
  const aiStatus = useSignalStore((state) => state.aiStatus)

  // Analytics query
  const { data: analytics, refetch: refetchAnalytics } = useQuery({
    queryKey: ['analytics-summary'],
    queryFn: api.getAnalyticsSummary,
    refetchInterval: 5000,
  })

  // Status query
  const { data: demoStatus, refetch: refetchStatus } = useQuery({
    queryKey: ['demo-status'],
    queryFn: api.getDemoStatus,
    refetchInterval: 2000,
  })

  useEffect(() => {
    if (demoStatus) {
      setStatus(demoStatus)
    }
  }, [demoStatus, setStatus])

  const handleToggleDemo = async () => {
    if (isRunning) {
      await api.stopDemo()
    } else {
      await api.startDemo()
    }
    refetchStatus()
    refetchAnalytics()
  }

  return (
    <div className="flex-1 space-y-6 p-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">System Overview</h2>
          <p className="text-muted-foreground">
            AI-Powered Infrasound Monitoring & Anomaly Detection
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Badge variant={isRunning ? 'success' : 'secondary'} className="text-sm px-4 py-1">
            {isRunning ? 'System Active' : 'System Idle'}
          </Badge>
          <Button
            onClick={handleToggleDemo}
            variant={isRunning ? 'destructive' : 'default'}
            className="gap-2"
          >
            {isRunning ? (
              <>
                <StopCircle className="h-4 w-4" /> Stop Monitoring
              </>
            ) : (
              <>
                <Play className="h-4 w-4" /> Start Demo Mode
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Top Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Stations</CardTitle>
            <Radio className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analytics?.active_stations || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Across global network
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Events Today</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analytics?.events_today || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Total detections
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Anomalies Detected</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              {analytics?.anomalies_detected || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Requiring attention
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Data Points</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatNumber((analytics?.data_points_processed || 0) / 1000, 1)}k
            </div>
            <p className="text-xs text-muted-foreground">
              Samples processed
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        {/* Real-time Status */}
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Real-Time Signal Status</CardTitle>
            <CardDescription>
              Current metrics for station INFRA-001
            </CardDescription>
          </CardHeader>
          <CardContent>
            {metrics ? (
              <div className="grid grid-cols-2 gap-8">
                <div className="space-y-4">
                  <div>
                    <div className="text-sm text-muted-foreground">Signal Quality</div>
                    <div className="text-2xl font-bold text-primary">
                      {formatNumber(metrics.signal_quality, 1)}%
                    </div>
                  </div>
                  <Separator />
                  <div>
                    <div className="text-sm text-muted-foreground">RMS Amplitude</div>
                    <div className="text-lg font-medium">
                      {formatNumber(metrics.rms, 4)}
                    </div>
                  </div>
                  <Separator />
                  <div>
                    <div className="text-sm text-muted-foreground">Signal-to-Noise Ratio</div>
                    <div className="text-lg font-medium">
                      {formatNumber(metrics.snr_db, 1)} dB
                    </div>
                  </div>
                </div>

                <div className="space-y-4 rounded-xl border bg-card p-6 shadow-sm">
                  <div className="flex items-center gap-2">
                    <div className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                      AI Inference Status
                    </div>
                  </div>
                  
                  {aiStatus ? (
                    <div className="space-y-4 mt-4">
                      <div>
                        <div className="text-xs text-muted-foreground">Current State</div>
                        <Badge 
                          variant={aiStatus.is_anomaly ? "destructive" : "success"}
                          className="mt-1 text-sm px-3 py-1"
                        >
                          {aiStatus.is_anomaly ? 'ANOMALY DETECTED' : 'NORMAL BACKGROUND'}
                        </Badge>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground">Anomaly Score</div>
                        <div className="text-xl font-bold font-mono">
                          {formatNumber(aiStatus.score, 3)}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground">Classification</div>
                        <div className="text-sm font-medium capitalize">
                          {aiStatus.event_type.replace(/_/g, ' ')}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex h-32 items-center justify-center text-sm text-muted-foreground">
                      Waiting for AI data...
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex h-48 items-center justify-center text-muted-foreground">
                Start the demo to view real-time metrics.
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Events */}
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Recent Events</CardTitle>
            <CardDescription>
              Latest detections across the network
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {latestEvents.length > 0 ? (
                latestEvents.map((event) => (
                  <div key={event.event_id} className="flex items-center">
                    <div className="space-y-1">
                      <p className="text-sm font-medium leading-none capitalize">
                        {event.event_type.replace(/_/g, ' ')}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {event.station_id} • {formatTimestamp(event.timestamp)}
                      </p>
                    </div>
                    <div className="ml-auto font-medium">
                      {event.is_anomaly ? (
                        <Badge variant="destructive">Anomaly</Badge>
                      ) : (
                        <Badge variant="secondary">Normal</Badge>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex h-32 items-center justify-center text-sm text-muted-foreground text-center">
                  No events detected yet. Start the system to monitor.
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

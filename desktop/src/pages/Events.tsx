import { useEffect, useState } from 'react'
import { AlertCircle, AlertTriangle, Filter, Search } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

import { api } from '@/services/api'
import { useEventStore } from '@/stores/eventStore'
import { formatNumber, formatTimestamp } from '@/lib/utils'

export default function Events() {
  const [page, setPage] = useState(0)
  const pageSize = 50

  // Real-time events from WebSocket store
  const realtimeEvents = useEventStore((state) => state.events)

  // Fetch historical events
  const { data: historicalEvents, isLoading } = useQuery({
    queryKey: ['events', page],
    queryFn: () => api.getEvents(pageSize, page * pageSize),
    refetchInterval: 10000, // Refresh every 10s
  })

  // Combine real-time and historical events, deduplicating by ID
  const allEvents = Array.from(
    new Map(
      [...(realtimeEvents || []), ...(historicalEvents || [])].map((item) => [item.event_id, item])
    ).values()
  ).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

  return (
    <div className="flex h-full flex-col space-y-6 p-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Event Log</h2>
          <p className="text-muted-foreground">
            Historical and real-time acoustic detections
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-2">
            <Filter className="h-4 w-4" /> Filter
          </Button>
          <Button variant="outline" size="sm" className="gap-2">
            <Search className="h-4 w-4" /> Search
          </Button>
        </div>
      </div>

      <Card className="flex-1 overflow-hidden flex flex-col">
        <CardHeader>
          <CardTitle>Detection History</CardTitle>
          <CardDescription>
            Showing {allEvents.length} recent events across the network.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex-1 overflow-auto p-0">
          <Table>
            <TableHeader className="bg-muted/50 sticky top-0 z-10">
              <TableRow>
                <TableHead>Timestamp</TableHead>
                <TableHead>Station</TableHead>
                <TableHead>Classification</TableHead>
                <TableHead>Confidence</TableHead>
                <TableHead>Anomaly Score</TableHead>
                <TableHead className="text-right">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && allEvents.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                    Loading events...
                  </TableCell>
                </TableRow>
              ) : allEvents.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                    No events detected yet.
                  </TableCell>
                </TableRow>
              ) : (
                allEvents.map((event) => (
                  <TableRow key={event.event_id}>
                    <TableCell className="font-mono text-xs">
                      {formatTimestamp(event.timestamp)}
                    </TableCell>
                    <TableCell className="font-medium">{event.station_id}</TableCell>
                    <TableCell className="capitalize">
                      {event.event_type.replace(/_/g, ' ')}
                    </TableCell>
                    <TableCell>
                      {formatNumber((event.confidence || 0) * 100, 1)}%
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {formatNumber(event.predictions?.[0]?.anomaly_score ?? 0, 3)}
                    </TableCell>
                    <TableCell className="text-right">
                      {event.is_anomaly ? (
                        <Badge variant="destructive" className="gap-1">
                          <AlertTriangle className="h-3 w-3" /> Anomaly
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="gap-1">
                          <AlertCircle className="h-3 w-3" /> Normal
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

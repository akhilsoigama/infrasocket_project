import { useQuery } from '@tanstack/react-query'
import { Database, Download, FileText, Search } from 'lucide-react'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { api } from '@/services/api'
import { formatTimestamp, formatNumber } from '@/lib/utils'

export default function HistoricalData() {
  // Fetch historical events with pagination
  const { data: events, isLoading } = useQuery({
    queryKey: ['historical-events'],
    queryFn: () => api.getEvents(10, 0),
  })

  return (
    <div className="flex h-full flex-col space-y-6 p-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Historical Data</h2>
          <p className="text-muted-foreground">
            Search and export past infrasound records
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" /> Export CSV
          </Button>
          <Button variant="outline">
            <FileText className="mr-2 h-4 w-4" /> Export Report
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Data Explorer</CardTitle>
          <CardDescription>Browse historical detections across the network</CardDescription>
          <div className="mt-4 flex max-w-sm items-center space-x-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input type="text" placeholder="Search by station or event type..." />
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <div className="grid grid-cols-5 border-b bg-muted/50 p-3 text-sm font-medium">
              <div>Event ID</div>
              <div>Timestamp</div>
              <div>Station</div>
              <div>Type</div>
              <div>SNR (dB)</div>
            </div>
            
            {isLoading ? (
              <div className="p-8 text-center text-muted-foreground">Loading historical data...</div>
            ) : events && events.length > 0 ? (
              events.map((evt) => (
                <div key={evt.event_id} className="grid grid-cols-5 items-center border-b p-3 text-sm last:border-0 hover:bg-muted/30">
                  <div className="font-mono text-xs truncate pr-2 text-muted-foreground" title={evt.event_id}>
                    {evt.event_id.split('-')[0]}...
                  </div>
                  <div>{formatTimestamp(evt.timestamp)}</div>
                  <div className="font-medium">{evt.station_id}</div>
                  <div className="capitalize">{evt.event_type.replace(/_/g, ' ')}</div>
                  <div>{formatNumber(evt.snr_db, 1)}</div>
                </div>
              ))
            ) : (
              <div className="p-8 flex flex-col items-center justify-center text-muted-foreground text-center">
                <Database className="h-8 w-8 mb-4 opacity-20" />
                <p>No historical data found in the database.</p>
                <p className="text-sm opacity-70">Generate some events in Demo Mode first.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

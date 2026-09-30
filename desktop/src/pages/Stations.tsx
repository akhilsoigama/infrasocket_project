import { useQuery } from '@tanstack/react-query'
import { Radio, Signal, Activity } from 'lucide-react'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { api } from '@/services/api'
import { formatNumber } from '@/lib/utils'

export default function Stations() {
  const { data: stations, isLoading } = useQuery({
    queryKey: ['stations'],
    queryFn: api.getStations,
    refetchInterval: 10000,
  })

  return (
    <div className="flex h-full flex-col space-y-6 p-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Monitoring Stations</h2>
        <p className="text-muted-foreground">
          Global infrasound sensor network
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {isLoading ? (
          <div className="col-span-full flex h-32 items-center justify-center text-muted-foreground">
            Loading stations...
          </div>
        ) : stations?.length === 0 ? (
          <div className="col-span-full flex h-32 items-center justify-center text-muted-foreground">
            No stations found. Ensure backend is running.
          </div>
        ) : (
          stations?.map((station) => (
            <Card key={station.station_id} className="flex flex-col">
              <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                <div className="space-y-1">
                  <CardTitle className="text-xl">{station.station_id}</CardTitle>
                  <CardDescription>{station.name}</CardDescription>
                </div>
                <Badge variant={station.is_online ? 'success' : 'secondary'}>
                  {station.is_online ? 'Online' : 'Offline'}
                </Badge>
              </CardHeader>
              <CardContent className="mt-4 flex-1">
                <div className="space-y-4 text-sm">
                  <div className="flex items-center justify-between border-b pb-2">
                    <span className="flex items-center text-muted-foreground">
                      <Radio className="mr-2 h-4 w-4" /> Sample Rate
                    </span>
                    <span>{station.sample_rate} Hz</span>
                  </div>
                  <div className="flex items-center justify-between border-b pb-2">
                    <span className="flex items-center text-muted-foreground">
                      <Signal className="mr-2 h-4 w-4" /> Signal Quality
                    </span>
                    <span className={station.signal_quality > 80 ? 'text-success font-medium' : ''}>
                      {formatNumber(station.signal_quality, 1)}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between pb-2">
                    <span className="flex items-center text-muted-foreground">
                      <Activity className="mr-2 h-4 w-4" /> Location
                    </span>
                    <span className="text-right">
                      {formatNumber(station.latitude, 4)}°, {formatNumber(station.longitude, 4)}°
                      <br />
                      <span className="text-xs text-muted-foreground">Elev: {station.elevation}m</span>
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}

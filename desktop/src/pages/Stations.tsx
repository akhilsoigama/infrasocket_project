import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Radio, Signal, Activity } from 'lucide-react'

import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { api } from '@/services/api'
import { formatNumber } from '@/lib/utils'
import { useStationStore } from '@/stores/stationStore'

function StationCard({ station }: { station: any }) {
  const navigate = useNavigate()
  
  // Use React query or simple fetch to check if backend data for this station has anomalies
  const [hasAnomaly, setHasAnomaly] = useState(false)
  const { acknowledgedAnomalies, acknowledge } = useStationStore()

  useEffect(() => {
    // Only check for IMA variations or ENCR1 as those are the datasets available
    const datasetToFetch = station.station_id.startsWith('IMA') ? 'IMA' : (station.station_id === 'ENCR1' ? 'ENCR1' : null);
    if (datasetToFetch) {
      fetch(`http://localhost:8000/api/analytics/dataset/${datasetToFetch}`)
        .then(r => r.json())
        .then(data => {
          if (data && data.anomalies && data.anomalies.length > 0) {
            setHasAnomaly(true)
          }
        })
        .catch(console.error)
    }
  }, [station.station_id])

  const isAlertActive = hasAnomaly && !acknowledgedAnomalies[station.station_id];

  const handleClick = () => {
    if (hasAnomaly) {
      acknowledge(station.station_id)
    }
    navigate(`/live?station=${station.station_id}`)
  }

  return (
    <Card 
      className={`flex flex-col cursor-pointer transition-all hover:scale-[1.02] ${isAlertActive ? 'border-red-500 bg-red-500/10 shadow-[0_0_15px_rgba(239,68,68,0.3)]' : 'hover:border-primary/50'}`}
      onClick={handleClick}
    >
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
        <div className="space-y-1">
          <CardTitle className="text-xl">{station.station_id}</CardTitle>
          <CardDescription>{station.name}</CardDescription>
        </div>
        <div className="flex flex-col items-end gap-2">
          <Badge variant={station.is_online ? 'success' : 'secondary'}>
            {station.is_online ? 'Online' : 'Offline'}
          </Badge>
          {isAlertActive && (
             <Badge variant="destructive" className="animate-pulse">
               Anomaly Detected!
             </Badge>
          )}
        </div>
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
  )
}

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
            <StationCard key={station.station_id} station={station} />
          ))
        )}
      </div>
    </div>
  )
}

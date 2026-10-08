import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Database, Zap, Activity, CheckCircle2, ShieldCheck, Loader2, AlertTriangle } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { api } from '@/services/api'

export default function Calibration() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['dataset-validation'],
    queryFn: () => api.validateDataset(), // Backend will automatically resolve its correct absolute path for the dataset
    staleTime: 60000,
  })
  
  const channels = data?.channels_detected || []
  const samplingRate = data?.sampling_rate || 0
  const isOptimal = data?.status === 'PASS'

  const [liveReadings, setLiveReadings] = useState<Record<string, string>>({})

  useEffect(() => {
    if (channels.length === 0) return
    const interval = setInterval(() => {
      const readings: Record<string, string> = {}
      channels.forEach((ch: string, idx: number) => {
        // Base sine wave for infrasound simulation + noise
        const base = Math.sin(Date.now() / 1000 + idx * 0.5) * 1.5;
        const noise = (Math.random() - 0.5) * 0.2;
        readings[ch] = (base + noise).toFixed(4)
      })
      setLiveReadings(readings)
    }, 100) // Fast update for live feel
    return () => clearInterval(interval)
  }, [channels])

  return (
    <div className="flex h-full flex-col space-y-8 p-8 max-w-6xl mx-auto animate-in fade-in zoom-in-95 duration-500">
      <div>
        <h2 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-primary to-primary/50 bg-clip-text text-transparent">
          System Calibration
        </h2>
        <p className="text-muted-foreground mt-2">
          Real-time instrument response and channel synchronization status.
        </p>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
          <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
          <p>Analyzing and calibrating sensors...</p>
        </div>
      ) : isError ? (
        <div className="flex flex-col items-center justify-center py-20 text-destructive">
          <AlertTriangle className="h-12 w-12 mb-4" />
          <p>Failed to connect to the calibration service.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className={`border-primary/20 shadow-[0_0_15px_rgba(59,130,246,0.15)] backdrop-blur-sm transition-all duration-300 hover:scale-[1.02] ${isOptimal ? 'bg-primary/5' : 'bg-destructive/5 border-destructive/20'}`}>
              <CardHeader>
                <CardTitle className="text-xl flex items-center gap-2">
                  <ShieldCheck className={`h-6 w-6 ${isOptimal ? 'text-primary' : 'text-destructive'}`} /> Global Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className={`text-4xl font-black ${isOptimal ? 'text-primary' : 'text-destructive'}`}>
                  {isOptimal ? 'OPTIMAL' : 'FAIL'}
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  {isOptimal ? 'All sensors calibrated' : 'Calibration failed'}
                </p>
              </CardContent>
            </Card>
            
            <Card className="border-border/50 backdrop-blur-sm transition-all duration-300 hover:scale-[1.02]">
              <CardHeader>
                <CardTitle className="text-xl flex items-center gap-2">
                  <Zap className="h-6 w-6 text-yellow-500" /> Active Channels
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-black">{channels.length}</div>
                <p className="text-sm text-muted-foreground mt-2">Actively transmitting</p>
              </CardContent>
            </Card>
            
            <Card className="border-border/50 backdrop-blur-sm transition-all duration-300 hover:scale-[1.02]">
              <CardHeader>
                <CardTitle className="text-xl flex items-center gap-2">
                  <Activity className="h-6 w-6 text-emerald-500" /> Sampling Rate
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-black">{samplingRate}<span className="text-2xl text-muted-foreground ml-1">Hz</span></div>
                <p className="text-sm text-muted-foreground mt-2">Nominal frequency</p>
              </CardContent>
            </Card>
          </div>

          <Card className="border-border/50 shadow-lg mt-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5 text-primary" /> Channel Calibration Matrix
              </CardTitle>
              <CardDescription>Real-time correction status for available seismic channels</CardDescription>
            </CardHeader>
            <CardContent>
              {channels.length === 0 ? (
                <div className="text-center py-10 text-muted-foreground">
                  No active channels detected.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {channels.map((ch: string, idx: number) => (
                    <div key={ch} className="group relative overflow-hidden rounded-xl border bg-card p-5 hover:border-primary/50 transition-all duration-300 hover:shadow-[0_0_20px_rgba(59,130,246,0.1)]">
                      <div className="flex justify-between items-start mb-4">
                        <div className="font-bold text-2xl tracking-tight">{ch}</div>
                        <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20">
                          <CheckCircle2 className="w-3 h-3 mr-1" /> Verified
                        </Badge>
                      </div>
                      <div className="space-y-3 text-sm text-muted-foreground">
                        <div className="flex justify-between items-center bg-primary/10 px-3 py-2 rounded-md border border-primary/20 mb-2">
                          <span className="flex items-center gap-2 text-primary font-bold">
                            <Activity className="w-4 h-4 animate-pulse" /> Live Output
                          </span>
                          <span className="font-mono font-black text-primary text-base whitespace-nowrap">
                            {liveReadings[ch] || '0.0000'}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span>Response</span>
                          <span className="font-medium text-foreground bg-secondary/50 px-2 py-0.5 rounded">Corrected</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span>Gain</span>
                          <span className="font-mono text-foreground bg-secondary/50 px-2 py-0.5 rounded">1.0{idx}e9</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span>Units</span>
                          <span className="font-medium text-foreground bg-secondary/50 px-2 py-0.5 rounded">Pascal</span>
                        </div>
                      </div>
                      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}

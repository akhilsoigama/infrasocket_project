import { Zap } from 'lucide-react'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

import { useRealtimeSignal } from '@/hooks/useRealtimeSignal'
import { useSignalStore } from '@/stores/signalStore'
import { useDemoStore } from '@/stores/demoStore'
import { api } from '@/services/api'
import { EventType } from '@/types'
import { WaveformChart } from '@/components/WaveformChart'

export default function LiveMonitoring() {
  // Ensure websocket is connected
  useRealtimeSignal()

  const { isRunning } = useDemoStore()
  const waveformBuffer = useSignalStore((state) => state.waveformBuffer)
  const aiStatus = useSignalStore((state) => state.aiStatus)
  const sampleRate = useSignalStore((state) => state.sampleRate)

  const handleInject = async (type: EventType) => {
    try {
      await api.injectEvent(type)
    } catch (e) {
      console.error('Failed to inject event', e)
    }
  }

  return (
    <div className="flex h-full flex-col space-y-6 p-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <span className="relative flex h-3 w-3">
              {isRunning && (
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              )}
              <span className={`relative inline-flex rounded-full h-3 w-3 ${isRunning ? 'bg-red-500' : 'bg-gray-500'}`}></span>
            </span>
            Live Monitoring
          </h2>
          <p className="text-muted-foreground">
            Real-time streaming from INFRA-001
          </p>
        </div>

        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => handleInject('possible_explosion_like')}
            disabled={!isRunning}
          >
            <Zap className="mr-2 h-4 w-4" /> Inject Explosion
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => handleInject('possible_meteor_like')}
            disabled={!isRunning}
          >
            <Zap className="mr-2 h-4 w-4" /> Inject Meteor
          </Button>
        </div>
      </div>

      <div className="flex-1 min-h-0 grid gap-6">
        <Card className="flex flex-col h-full overflow-hidden shadow-md border-primary/20">
          <CardHeader className="py-4">
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Continuous Waveform</CardTitle>
                <CardDescription>Rolling 40-second buffer</CardDescription>
              </div>
              {aiStatus && (
                <Badge variant={aiStatus.is_anomaly ? 'destructive' : 'secondary'}>
                  {aiStatus.is_anomaly ? 'ANOMALY DETECTED' : 'NORMAL'}
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="flex-1 min-h-0 p-0 px-6 pb-6">
            {waveformBuffer.length > 0 ? (
              <WaveformChart 
                data={waveformBuffer} 
                sampleRate={sampleRate} 
                height={500} 
                color={aiStatus?.is_anomaly ? '#ef4444' : 'hsl(var(--primary))'}
              />
            ) : (
              <div className="h-full flex items-center justify-center border rounded-md bg-muted/20">
                <p className="text-muted-foreground text-sm">Waiting for signal data... Is the demo running?</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

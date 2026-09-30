import { useState, useEffect } from 'react'
import { Zap } from 'lucide-react'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

import { useRealtimeSignal } from '@/hooks/useRealtimeSignal'
import { useSignalStore } from '@/stores/signalStore'
import { useDemoStore } from '@/stores/demoStore'
import { api } from '@/services/api'
import { EventType } from '@/types'
import { useQuery } from '@tanstack/react-query'
import Plot from 'react-plotly.js'

import { WaveformChart } from '@/components/WaveformChart'

export default function LiveMonitoring() {
  // Ensure websocket is connected
  useRealtimeSignal()

  const { isRunning } = useDemoStore()
  const waveformBuffer = useSignalStore((state) => state.waveformBuffer)
  const aiStatus = useSignalStore((state) => state.aiStatus)
  const sampleRate = useSignalStore((state) => state.sampleRate)

  const [offset, setOffset] = useState(0)
  const [demoMode, setDemoMode] = useState<'normal' | 'explosion' | 'meteor'>('normal')

  useEffect(() => {
    if (isRunning) return
    const interval = setInterval(() => {
      setOffset((prev) => prev + 10)
    }, 50)
    return () => clearInterval(interval)
  }, [isRunning])

  // Cycle through different AI event types every 6 seconds to show off the UI
  useEffect(() => {
    if (isRunning) return
    const modes = ['normal', 'explosion', 'normal', 'meteor'] as const
    let i = 0
    const interval = setInterval(() => {
      i = (i + 1) % modes.length
      setDemoMode(modes[i])
    }, 6000)
    return () => clearInterval(interval)
  }, [isRunning])

  // Dummy Data Generators (Complex overlapping waves for organic continuous pattern)
  const dummyWaveform = Array.from({ length: 4000 }, (_, i) => {
    const x = i + offset
    if (demoMode === 'explosion') {
      return Math.sin(x / 5) * 1.5 + Math.sin(x / 2) * 1.0 + (Math.random() - 0.5) * 1.5
    } else if (demoMode === 'meteor') {
      return Math.sin(x / 40) * 1.5 + Math.sin(x / 15) * 0.8
    } else {
      return Math.sin(x / 20) * 0.3 + Math.sin(x / 5) * 0.1 + Math.sin(x / 60) * 0.4
    }
  })
  
  const dummySpectrogram = {
    times: Array.from({ length: 50 }, (_, i) => i * 0.1),
    frequencies: Array.from({ length: 50 }, (_, i) => i * 2),
    magnitudes: Array.from({ length: 50 }, (_, t) => 
      Array.from({ length: 50 }, (_, f) => {
        const base = Math.abs(Math.sin((t + offset/100) * 0.8) * Math.cos(f * 0.3 + (offset/200)))
        const heat = demoMode === 'explosion' ? 2 : (demoMode === 'meteor' ? 1.5 : 0)
        return base + (Math.sin(f + t) * 0.1) + (Math.random() * 0.2 * heat)
      })
    )
  }

  const displayAiStatus = isRunning ? aiStatus : {
    is_anomaly: demoMode !== 'normal',
    score: demoMode === 'explosion' ? 0.94 : (demoMode === 'meteor' ? 0.82 : 0.12),
    event_type: demoMode === 'normal' ? 'background_noise' : (demoMode === 'explosion' ? 'possible_explosion_like' : 'possible_meteor_like'),
  }

  // Bind Spectrogram API
  const { data: spectrogram } = useQuery({
    queryKey: ['spectrogram-live'],
    queryFn: api.getSpectrogram,
    refetchInterval: 3000, // Fetch every 3 seconds while live
    enabled: isRunning, // Only fetch if demo is running
  })

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

      <div className="flex-1 min-h-0 flex flex-col gap-6">
        <Card className="flex flex-col flex-1 overflow-hidden shadow-md border-primary/20 min-h-[300px]">
          <CardHeader className="py-4">
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Continuous Waveform</CardTitle>
                <CardDescription>Rolling 40-second buffer</CardDescription>
              </div>
              {displayAiStatus && (
                <Badge variant={displayAiStatus.is_anomaly ? 'destructive' : 'secondary'} className="px-3 py-1 text-sm">
                  {displayAiStatus.is_anomaly ? `ANOMALY: ${displayAiStatus.event_type.toUpperCase().replace(/_/g, ' ')} (${(displayAiStatus.score * 100).toFixed(1)}%)` : 'NORMAL'}
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="flex-1 min-h-0 p-0 px-6 pb-6">
            <WaveformChart 
              data={waveformBuffer.length > 0 ? waveformBuffer : dummyWaveform} 
              sampleRate={sampleRate} 
              height={500} 
              color={displayAiStatus?.is_anomaly ? '#ef4444' : 'hsl(var(--primary))'}
            />
          </CardContent>
        </Card>

        {/* Spectrogram API visualization */}
        <Card className="flex flex-col h-[350px] shadow-md border-primary/20 shrink-0">
          <CardHeader className="py-4">
            <CardTitle>Time-Frequency Spectrogram</CardTitle>
            <CardDescription>Live STFT analysis via REST API</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 min-h-0 p-0 px-6 pb-6">
              <div className="w-full h-full rounded-md overflow-hidden bg-card border">
                <Plot
                  data={[
                    {
                      z: (spectrogram && isRunning) ? spectrogram.magnitudes : dummySpectrogram.magnitudes,
                      x: (spectrogram && isRunning) ? spectrogram.times : dummySpectrogram.times,
                      y: (spectrogram && isRunning) ? spectrogram.frequencies : dummySpectrogram.frequencies,
                      type: 'heatmap',
                      colorscale: 'Viridis',
                      showscale: false,
                    },
                  ]}
                  layout={{
                    autosize: true,
                    margin: { l: 50, r: 20, t: 20, b: 40 },
                    paper_bgcolor: 'rgba(0,0,0,0)',
                    plot_bgcolor: 'rgba(0,0,0,0)',
                    xaxis: {
                      title: { text: 'Time (s)', font: { color: '#999' } },
                      gridcolor: '#333',
                      tickfont: { color: '#999' },
                    },
                    yaxis: {
                      title: { text: 'Frequency (Hz)', font: { color: '#999' } },
                      gridcolor: '#333',
                      tickfont: { color: '#999' },
                    },
                  }}
                  useResizeHandler={true}
                  style={{ width: '100%', height: '100%' }}
                  config={{ displayModeBar: false, responsive: true }}
                />
              </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

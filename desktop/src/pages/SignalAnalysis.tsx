import { useQuery } from '@tanstack/react-query'
import Plot from 'react-plotly.js'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { api } from '@/services/api'
import { useSignalStore } from '@/stores/signalStore'

export default function SignalAnalysis() {
  const sampleRate = useSignalStore((state) => state.sampleRate)

  // Fetch FFT data
  const { data: fftData } = useQuery({
    queryKey: ['fft'],
    queryFn: api.getFFT,
    refetchInterval: 2000, // Pull FFT every 2 seconds for demo
  })

  return (
    <div className="flex h-full flex-col space-y-6 p-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Signal Analysis</h2>
        <p className="text-muted-foreground">
          Frequency domain analysis and spectrograms
        </p>
      </div>

      <div className="grid gap-6 grid-cols-1 lg:grid-cols-2 flex-1 min-h-0">
        <Card className="flex flex-col h-[500px]">
          <CardHeader>
            <CardTitle>Power Spectrum (FFT)</CardTitle>
            <CardDescription>Frequency distribution of the current signal window</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 p-0 px-6 pb-6">
            {fftData ? (
              <div className="w-full h-full rounded-md overflow-hidden bg-card border">
                <Plot
                  data={[
                    {
                      x: fftData.frequencies,
                      y: fftData.magnitudes,
                      type: 'scatter',
                      mode: 'lines',
                      fill: 'tozeroy',
                      line: { color: 'hsl(var(--primary))', width: 2 },
                    },
                  ]}
                  layout={{
                    autosize: true,
                    margin: { l: 50, r: 20, t: 20, b: 40 },
                    paper_bgcolor: 'rgba(0,0,0,0)',
                    plot_bgcolor: 'rgba(0,0,0,0)',
                    xaxis: {
                      title: { text: 'Frequency (Hz)', font: { color: '#999' } },
                      gridcolor: '#333',
                      tickfont: { color: '#999' },
                      range: [0, sampleRate / 2], // Nyquist limit
                    },
                    yaxis: {
                      title: { text: 'Magnitude', font: { color: '#999' } },
                      gridcolor: '#333',
                      tickfont: { color: '#999' },
                      type: 'log',
                    },
                    showlegend: false,
                  }}
                  useResizeHandler={true}
                  style={{ width: '100%', height: '100%' }}
                  config={{ displayModeBar: false, responsive: true }}
                />
              </div>
            ) : (
              <div className="flex h-full items-center justify-center text-muted-foreground border rounded-md">
                Waiting for FFT data...
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

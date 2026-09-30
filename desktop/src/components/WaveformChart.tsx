import React, { useMemo } from 'react'
import Plot from 'react-plotly.js'

interface WaveformChartProps {
  data: number[]
  sampleRate?: number
  height?: number
  color?: string
  title?: string
}

export function WaveformChart({
  data,
  sampleRate = 100,
  height = 300,
  color = 'hsl(var(--primary))',
  title,
}: WaveformChartProps) {
  // Generate time array based on sample rate
  const time = useMemo(() => {
    return Array.from({ length: data.length }, (_, i) => i / sampleRate)
  }, [data.length, sampleRate])

  return (
    <div className="w-full h-full rounded-md overflow-hidden bg-card border">
      <Plot
        data={[
          {
            x: time,
            y: data,
            type: 'scatter',
            mode: 'lines',
            line: {
              color,
              width: 1.5,
            },
            hoverinfo: 'none',
          },
        ]}
        layout={{
          title: title ? { text: title, font: { color: '#ccc', size: 14 } } : undefined,
          autosize: true,
          height,
          margin: { l: 50, r: 20, t: title ? 40 : 20, b: 40 },
          paper_bgcolor: 'rgba(0,0,0,0)',
          plot_bgcolor: 'rgba(0,0,0,0)',
          xaxis: {
            title: 'Time (s)',
            gridcolor: '#333',
            zerolinecolor: '#444',
            tickfont: { color: '#999' },
            titlefont: { color: '#999' },
            fixedrange: true, // disable zoom for performance on streaming
          },
          yaxis: {
            title: 'Amplitude',
            gridcolor: '#333',
            zerolinecolor: '#555',
            tickfont: { color: '#999' },
            titlefont: { color: '#999' },
            fixedrange: true,
            // Keep y-axis relatively stable unless there are huge spikes
            range: [-2, 2],
            autorange: false,
          },
          showlegend: false,
        }}
        useResizeHandler={true}
        style={{ width: '100%', height: '100%' }}
        config={{
          displayModeBar: false,
          responsive: true,
        }}
      />
    </div>
  )
}

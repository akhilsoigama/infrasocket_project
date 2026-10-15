import { useState, useEffect, useMemo, useRef } from 'react'
import Plot from 'react-plotly.js'
import { useSearchParams } from 'react-router-dom'
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Cpu,
  Database,
  Download,
  FileUp,
  HelpCircle,
  Play,
  RotateCcw,
  SlidersHorizontal,
  StopCircle,
  Waves,
} from 'lucide-react'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { PageHeader } from '@/components/common/PageHeader'
import { Separator } from '@/components/ui/separator'
import {
  detectArrival,
  calculateStats,
  applyBandpassFilter,
  computeSpectrum,
} from '@/lib/signalProcessing'
import { api } from '@/services/api'
import { useSystemStore } from '@/stores/systemStore'
import { useSignalStore } from '@/stores/signalStore'
import { useDemoStore } from '@/stores/demoStore'
import { playAlertSound } from '@/utils/sound'

type MonitoringMode = 'live_sensor' | 'dataset' | 'demo'

export default function LiveMonitoring() {
  const [searchParams] = useSearchParams()
  const stationParam = searchParams.get('station')

  // Top-level Mode Selector: Live Sensor / Recorded Dataset / Demo Stream
  const [mode, setMode] = useState<MonitoringMode>('dataset')

  // Station / Dataset selection
  const isIMAChannel = stationParam?.startsWith('IMA') && stationParam !== 'IMA'
  const initialDataset = stationParam === 'ENCR1' ? 'ENCR1' : 'IMA'
  const [activeDataset, setActiveDataset] = useState<'IMA' | 'ENCR1' | 'ENCR_ARRAY' | string>(initialDataset)
  const [selectedChannel, setSelectedChannel] = useState<string | null>(isIMAChannel ? stationParam : null)
  const [isLoading, setIsLoading] = useState(false)

  // Data states from backend API
  const [imaData, setImaData] = useState<any>(null)
  const [encr1Data, setEncr1Data] = useState<any>(null)
  const [encrArrayData, setEncrArrayData] = useState<any>(null)
  const [userDatasets, setUserDatasets] = useState<Record<string, any>>({})

  // Hardware status state
  const [hardwareInfo, setHardwareInfo] = useState<any>(null)
  const [isCheckingHardware, setIsCheckingHardware] = useState(false)

  // Filter state (Target range 0.01 - 20.0 Hz)
  const [useFilter, setUseFilter] = useState(true)
  const [lowCut, setLowCut] = useState(0.01)
  const [highCut, setHighCut] = useState(5.0)

  // UI Control state
  const [windowSizeSec, setWindowSizeSec] = useState(10)
  const [playbackSpeed, setPlaybackSpeed] = useState(1.0)

  // Continuous Running state
  const [offset, setOffset] = useState(0)
  const [isPlaying, setIsPlaying] = useState(true)
  const [showControls, setShowControls] = useState(false)
  const [showImportModal, setShowImportModal] = useState(false)

  // Demo store
  const { isRunning: isDemoRunning } = useDemoStore()
  const waveformBuffer = useSignalStore((state) => state.waveformBuffer)

  // Query hardware status
  useEffect(() => {
    async function checkHw() {
      try {
        const hw = await api.getHardwareStatus()
        setHardwareInfo(hw)
      } catch (err) {
        console.error('Failed to get hardware status:', err)
      }
    }
    checkHw()
  }, [])

  // Animation frame loop for continuous dataset playback (throttled for zero UI lag)
  useEffect(() => {
    if (!isPlaying || mode === 'live_sensor') return
    let animationFrameId: number
    let lastTime = performance.now()

    const renderLoop = (time: number) => {
      if (time - lastTime >= 60) {
        const step = activeDataset === 'IMA' ? 2 : 0.5
        setOffset((prev) => prev + step * playbackSpeed)
        lastTime = time
      }
      animationFrameId = requestAnimationFrame(renderLoop)
    }

    animationFrameId = requestAnimationFrame(renderLoop)
    return () => cancelAnimationFrame(animationFrameId)
  }, [isPlaying, activeDataset, playbackSpeed, mode])

  // Load dataset when activeDataset changes
  useEffect(() => {
    async function loadData() {
      if (mode !== 'dataset') return
      setIsLoading(true)
      try {
        if (activeDataset === 'IMA' && !imaData) {
          const res = await api.getDatasetData('IMA')
          setImaData(res)
        } else if (activeDataset === 'ENCR1' && !encr1Data) {
          const res = await api.getDatasetData('ENCR1')
          setEncr1Data(res)
        } else if (activeDataset === 'ENCR_ARRAY' && !encrArrayData) {
          const res = await api.getDatasetData('ENCR_ARRAY')
          setEncrArrayData(res)
        }
      } catch (err) {
        console.error('Error loading dataset from backend API:', err)
      }
      setIsLoading(false)
    }
    loadData()
  }, [activeDataset, mode, imaData, encr1Data, encrArrayData])

  // Reset playback
  const handleReset = () => {
    setOffset(0)
  }

  // Attempt hardware connection test
  const handleTestHardwareConnection = async () => {
    setIsCheckingHardware(true)
    try {
      const res = await api.connectHardware()
      const hw = await api.getHardwareStatus()
      setHardwareInfo(hw)
    } catch (err) {
      console.error('Hardware connection check failed:', err)
    }
    setIsCheckingHardware(false)
  }

  // Handle local CSV file import
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      const text = event.target?.result as string
      if (!text) return

      const lines = text.split('\n').filter((l) => l.trim().length > 0)
      const values: number[] = []

      lines.forEach((line, idx) => {
        if (idx === 0 && isNaN(Number(line.split(',')[0]))) return // header
        const parts = line.split(',')
        const num = parseFloat(parts[parts.length - 1])
        if (!isNaN(num)) values.push(num)
      })

      if (values.length > 0) {
        const customName = file.name.replace(/\.[^/.]+$/, '')
        const customPayload = {
          name: customName,
          category: 'User Imported Infrasound',
          data: values.map((v, i) => ({ time: `${(i / 40.0).toFixed(3)}`, value: v, sample_rate: 40.0 })),
          filtered_infrasound: values,
          anomalies: [],
          units: 'Pascal (Pa)',
        }
        setUserDatasets((prev) => ({ ...prev, [customName]: customPayload }))
        setActiveDataset(customName)
        setShowImportModal(false)
      }
    }
    reader.readAsText(file)
  }

  // Compute stats and metadata for active dataset
  const datasetInfo = useMemo(() => {
    if (activeDataset === 'IMA' && imaData?.data) {
      const rows = imaData.data.length
      const duration = imaData.data[rows - 1][0] - imaData.data[0][0]
      const sampleRate = 1 / (imaData.data[1][0] - imaData.data[0][0])
      const stats = (imaData.headers || []).slice(1).map((ch: string, i: number) => {
        const vals = imaData.data.map((d: any) => d[i + 1])
        return { channel: ch, ...calculateStats(vals) }
      })
      return {
        name: 'IMA Array (Beirut Explosion)',
        category: 'Explosion Transient Recording',
        source: 'IMA Infrasound Array, Beirut (2020)',
        rows,
        duration,
        sampleRate,
        units: 'Pascal (Pa)',
        stats,
        anomalies: imaData.anomalies?.length || 0,
      }
    }
    if (activeDataset === 'ENCR1' && encr1Data?.data) {
      const rows = encr1Data.data.length
      const sampleRate = encr1Data.data[0]?.sample_rate || 20
      const duration = rows / sampleRate
      const CAL_FACTOR = 0.00025
      const vals = encr1Data.data.map((d: any) => d.value * CAL_FACTOR)
      const stats = [{ channel: 'HDF (Calibrated)', ...calculateStats(vals) }]
      return {
        name: 'ENCR1 Station (Mount Etna Volcanic)',
        category: 'Volcanic Degassing Tremor Recording',
        source: 'INGV Infrasound Network, Sicily',
        rows,
        duration,
        sampleRate,
        units: 'Acoustic Pressure (Pa)',
        stats,
        anomalies: encr1Data.anomalies?.length || 0,
      }
    }
    if (activeDataset === 'ENCR_ARRAY' && encrArrayData?.data) {
      const rows = encrArrayData.data.length
      const sampleRate = encrArrayData.data[0]?.sample_rate || 20
      const duration = rows / sampleRate
      const CAL_FACTOR = 0.00025
      const vals = encrArrayData.data.map((d: any) => d.value * CAL_FACTOR)
      const stats = [{ channel: 'HDF (Array Channel)', ...calculateStats(vals) }]
      return {
        name: 'ENCR Multi-Station Array',
        category: 'Volcanic Array Infrasound Archive',
        source: 'ENCR 6-element Array (MiniSEED)',
        rows,
        duration,
        sampleRate,
        units: 'Acoustic Pressure (Pa)',
        stats,
        anomalies: encrArrayData.anomalies?.length || 0,
      }
    }
    if (userDatasets[activeDataset]) {
      const ud = userDatasets[activeDataset]
      const rows = ud.data.length
      const sampleRate = 40.0
      return {
        name: ud.name,
        category: 'User Imported Recording',
        source: 'Local Infrasound Data File',
        rows,
        duration: rows / sampleRate,
        sampleRate,
        units: 'Pascal (Pa)',
        stats: [{ channel: 'CH1', ...calculateStats(ud.data.map((d: any) => d.value)) }],
        anomalies: 0,
      }
    }
    return null
  }, [activeDataset, imaData, encr1Data, encrArrayData, userDatasets])

  // High-performance precomputation: filter all dataset channels once when data/filters change
  // This completely eliminates expensive Butterworth filtering during the animation loop!
  const preprocessedDataset = useMemo(() => {
    if (activeDataset === 'IMA' && imaData?.data) {
      const channels = imaData.headers?.slice(1) || []
      const sampleRate = 40
      const n = imaData.data.length
      const channelSeries = channels.map((ch: string, i: number) => {
        let allVals = imaData.data.map((d: any) => d[i + 1])
        if (useFilter) {
          if (i === 0 && imaData.filtered_infrasound) {
            allVals = imaData.filtered_infrasound
          } else {
            allVals = applyBandpassFilter(allVals, lowCut, highCut, sampleRate)
          }
        }
        return { name: ch, allVals }
      })
      return { sampleRate, n, channels: channelSeries, anomalies: imaData.anomalies || [] }
    }

    if (activeDataset === 'ENCR1' && encr1Data?.data) {
      const sampleRate = encr1Data.data[0]?.sample_rate || 20
      const n = encr1Data.data.length
      const CAL_FACTOR = 0.00025
      let allVals = encr1Data.data.map((d: any) => d.value * CAL_FACTOR)
      if (useFilter) {
        if (encr1Data.filtered_infrasound) {
          allVals = encr1Data.filtered_infrasound.map((v: number) => v * CAL_FACTOR)
        } else {
          allVals = applyBandpassFilter(allVals, lowCut, highCut, sampleRate)
        }
      }
      return { sampleRate, n, channels: [{ name: 'ENCR1 HDF', allVals }], anomalies: encr1Data.anomalies || [] }
    }

    if (activeDataset === 'ENCR_ARRAY' && encrArrayData?.data) {
      const sampleRate = encrArrayData.data[0]?.sample_rate || 20
      const n = encrArrayData.data.length
      const CAL_FACTOR = 0.00025
      let allVals = encrArrayData.data.map((d: any) => d.value * CAL_FACTOR)
      if (useFilter) {
        allVals = applyBandpassFilter(allVals, lowCut, highCut, sampleRate)
      }
      return { sampleRate, n, channels: [{ name: 'ENCR Channel', allVals }], anomalies: encrArrayData.anomalies || [] }
    }

    if (userDatasets[activeDataset]?.data) {
      const ud = userDatasets[activeDataset]
      const sampleRate = 40.0
      const n = ud.data.length
      let allVals = ud.data.map((d: any) => d.value)
      if (useFilter) {
        allVals = applyBandpassFilter(allVals, lowCut, highCut, sampleRate)
      }
      return { sampleRate, n, channels: [{ name: ud.name, allVals }], anomalies: [] }
    }

    return null
  }, [activeDataset, imaData, encr1Data, encrArrayData, userDatasets, useFilter, lowCut, highCut])

  // Plotly chart series generator (optimized: only fast array slicing in playback loop)
  const chartData = useMemo(() => {
    if (mode === 'live_sensor') {
      return []
    }

    if (mode === 'demo') {
      const windowX = Array.from({ length: waveformBuffer.length }, (_, i) => +(i / 100.0).toFixed(2))
      return [
        {
          name: 'DEMO SYNTHETIC INFRASOUND (0.01 - 20 Hz)',
          traces: [
            {
              x: windowX,
              y: waveformBuffer,
              type: 'scatter',
              mode: 'lines',
              name: 'Synthetic Waveform',
              fill: 'tozeroy',
              fillcolor: 'rgba(56, 189, 248, 0.1)',
              line: { color: '#38bdf8', width: 2 },
            },
          ],
        },
      ]
    }

    if (!preprocessedDataset) return []

    const { sampleRate, n, channels, anomalies } = preprocessedDataset
    const windowSize = Math.floor(windowSizeSec * sampleRate)
    const startIdx = Math.floor(offset) % Math.max(1, n)
    const endIdx = startIdx + windowSize

    const getSlice = (arr: number[]) => {
      if (endIdx <= n) return arr.slice(startIdx, endIdx)
      return [...arr.slice(startIdx, n), ...arr.slice(0, endIdx - n)]
    }

    const windowX = Array.from({ length: windowSize }, (_, i) => +(i / sampleRate).toFixed(2))
    const colors = ['#38bdf8', '#10b981', '#f59e0b', '#06b6d4']
    const rgbaColors = [
      'rgba(56, 189, 248, 0.12)',
      'rgba(16, 185, 129, 0.12)',
      'rgba(245, 158, 11, 0.12)',
      'rgba(6, 182, 212, 0.12)',
    ]

    return channels.map((chObj: { name: string; allVals: number[] }, i: number) => {
      const vals = getSlice(chObj.allVals)
      const traces: any[] = [
        {
          x: windowX,
          y: vals,
          type: 'scatter',
          mode: 'lines',
          name: chObj.name,
          fill: 'tozeroy',
          fillcolor: rgbaColors[i % rgbaColors.length],
          line: { color: colors[i % colors.length], width: 1.8 },
        },
      ]

      if (anomalies.length > 0) {
        const anomalyPointsX: (number | null)[] = []
        const anomalyPointsY: (number | null)[] = []
        let lastAIdx = -1

        anomalies.forEach((aIdx: number) => {
          if (lastAIdx !== -1 && aIdx - lastAIdx > 1) {
            anomalyPointsX.push(null)
            anomalyPointsY.push(null)
          }
          lastAIdx = aIdx

          if (endIdx <= n) {
            if (aIdx >= startIdx && aIdx < endIdx) {
              anomalyPointsX.push((aIdx - startIdx) / sampleRate)
              anomalyPointsY.push(chObj.allVals[aIdx])
            }
          } else {
            if (aIdx >= startIdx) {
              anomalyPointsX.push((aIdx - startIdx) / sampleRate)
              anomalyPointsY.push(chObj.allVals[aIdx])
            } else if (aIdx < endIdx - n) {
              anomalyPointsX.push((aIdx + n - startIdx) / sampleRate)
              anomalyPointsY.push(chObj.allVals[aIdx])
            }
          }
        })

        if (anomalyPointsX.some((x) => x !== null)) {
          traces.push({
            x: anomalyPointsX,
            y: anomalyPointsY,
            type: 'scatter',
            mode: 'lines',
            name: 'Heuristic Outlier',
            line: { color: '#ef4444', width: 2 },
          })
        }
      }

      return { name: chObj.name, traces }
    })
  }, [mode, preprocessedDataset, waveformBuffer, offset, windowSizeSec])

  const isAnomalyVisible = useMemo(() => {
    return chartData.some((plot: any) =>
      plot.traces.some((trace: any) => trace.name === 'Heuristic Outlier')
    )
  }, [chartData])

  useEffect(() => {
    if (isAnomalyVisible) {
      playAlertSound()
    }
  }, [isAnomalyVisible])

  return (
    <div className="flex h-full flex-col space-y-4 sm:space-y-6 p-4 sm:p-6 lg:p-8 overflow-y-auto min-w-0">
      <PageHeader
        title="Live Infrasound Monitoring"
        subtitle="TARGET BAND: 0.01 – 20.0 Hz • MULTI-CHANNEL WAVEFORMS • BUTTERWORTH BANDPASS"
        badgeText={
          mode === 'live_sensor'
            ? 'HARDWARE STANDBY'
            : mode === 'demo'
            ? 'DEMO DATA (SYNTHETIC)'
            : `${activeDataset} RECORDING • ${isPlaying ? 'RUNNING' : 'PAUSED'}`
        }
        badgeVariant={
          mode === 'live_sensor'
            ? 'secondary'
            : mode === 'demo'
            ? 'default'
            : isPlaying
            ? 'success'
            : 'secondary'
        }
      >
        <div className="flex flex-wrap items-center gap-2">
          {mode !== 'live_sensor' && (
            <>
              <Button
                size="sm"
                variant="outline"
                onClick={handleReset}
                className="h-8 font-mono text-xs gap-1"
              >
                <RotateCcw className="h-3 w-3" />
                Reset
              </Button>
              <Button
                size="sm"
                variant={isPlaying ? 'destructive' : 'default'}
                onClick={() => setIsPlaying(!isPlaying)}
                className="h-8 font-mono text-xs gap-1"
              >
                {isPlaying ? (
                  <>
                    <StopCircle className="h-3.5 w-3.5" /> Pause
                  </>
                ) : (
                  <>
                    <Play className="h-3.5 w-3.5" /> Play
                  </>
                )}
              </Button>
            </>
          )}

          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowImportModal(true)}
            className="font-mono text-xs h-8 gap-1"
          >
            <FileUp className="w-3.5 h-3.5" />
            Import
          </Button>

          <Button
            size="sm"
            variant={showControls ? 'secondary' : 'outline'}
            onClick={() => setShowControls(!showControls)}
            className="font-mono text-xs h-8"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 mr-1.5" />
            DSP Controls
          </Button>
        </div>
      </PageHeader>

      {/* Acquisition Source & Dataset Toolbar */}
      <Card className="border-border/60 bg-card/70 backdrop-blur-md min-w-0">
        <CardContent className="p-3.5 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-mono text-muted-foreground uppercase font-bold mr-1">
              Source:
            </span>
            <div className="flex items-center rounded-md border border-border/60 bg-muted/30 p-0.5 text-xs font-mono">
              <button
                type="button"
                onClick={() => setMode('live_sensor')}
                className={`rounded px-2.5 py-1 transition-colors ${
                  mode === 'live_sensor'
                    ? 'bg-primary text-primary-foreground font-bold'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Live Sensor (Standby)
              </button>
              <button
                type="button"
                onClick={() => setMode('dataset')}
                className={`rounded px-2.5 py-1 transition-colors ${
                  mode === 'dataset'
                    ? 'bg-primary text-primary-foreground font-bold'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Recorded Datasets
              </button>
              <button
                type="button"
                onClick={() => setMode('demo')}
                className={`rounded px-2.5 py-1 transition-colors ${
                  mode === 'demo'
                    ? 'bg-primary text-primary-foreground font-bold'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Demo Data
              </button>
            </div>
          </div>

          {mode === 'dataset' && (
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-3xs font-mono text-muted-foreground uppercase mr-1">
                Active Recording:
              </span>
              <Button
                size="sm"
                variant={activeDataset === 'IMA' && !selectedChannel ? 'default' : 'outline'}
                onClick={() => {
                  setActiveDataset('IMA')
                  setSelectedChannel(null)
                }}
                className="font-mono text-xs h-7"
              >
                IMA Array (Beirut)
              </Button>
              <Button
                size="sm"
                variant={activeDataset === 'ENCR1' ? 'default' : 'outline'}
                onClick={() => {
                  setActiveDataset('ENCR1')
                  setSelectedChannel(null)
                }}
                className="font-mono text-xs h-7"
              >
                ENCR1 (Mt. Etna)
              </Button>
              <Button
                size="sm"
                variant={activeDataset === 'ENCR_ARRAY' ? 'default' : 'outline'}
                onClick={() => {
                  setActiveDataset('ENCR_ARRAY')
                  setSelectedChannel(null)
                }}
                className="font-mono text-xs h-7"
              >
                ENCR Array (MiniSEED)
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Mode-Specific Information Banners */}
      {mode === 'live_sensor' && (
        <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-5 font-mono text-xs text-foreground">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <Cpu className="h-6 w-6 text-amber-400 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-bold text-sm text-amber-400">
                  Live Microbarometer Sensor Interface — Standby
                </h3>
                <p className="text-2xs text-muted-foreground mt-1">
                  Status: <strong>{hardwareInfo?.status_message || 'Live sensor not connected.'}</strong>
                </p>
                <p className="text-2xs text-muted-foreground mt-0.5">
                  Target Operating Bandwidth: <strong>0.01 Hz to 20.0 Hz</strong> • Expected Input: Differential Pressure (Pa) via 24-bit DAQ ADC or Serial Stream
                </p>
              </div>
            </div>

            <Button
              size="sm"
              variant="outline"
              disabled={isCheckingHardware}
              onClick={handleTestHardwareConnection}
              className="font-mono text-xs flex-shrink-0"
            >
              {isCheckingHardware ? 'Probing Hardware...' : 'Scan / Probe Hardware'}
            </Button>
          </div>
        </div>
      )}

      {mode === 'demo' && (
        <div className="rounded-lg border border-cyan-500/40 bg-cyan-500/10 p-4 font-mono text-xs text-foreground flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Waves className="h-5 w-5 text-cyan-400 flex-shrink-0" />
            <div>
              <span className="font-bold text-cyan-400">DEMO MODE — SYNTHETIC SIGNALS</span>
              <p className="text-2xs text-muted-foreground">
                Displaying mathematically modeled atmospheric infrasound waveforms (0.01 – 20 Hz) with synthetic background noise.
              </p>
            </div>
          </div>
          <Badge variant="outline" className="font-mono text-2xs uppercase border-cyan-400/40 text-cyan-400">
            DEMO GENERATOR
          </Badge>
        </div>
      )}

      {/* Heuristic Arrival Tag Banner */}
      {isAnomalyVisible && mode === 'dataset' && (
        <div className="bg-destructive/15 border-l-4 border-destructive p-4 rounded-r-md flex items-start gap-4 font-mono">
          <AlertTriangle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-bold text-destructive">
              OUTLIER ARRIVAL PHASE DETECTED
            </h3>
            <p className="text-xs text-destructive/90 mt-0.5">
              Rule-Based Signal Analysis Tag:{' '}
              {activeDataset === 'IMA'
                ? 'High-yield blast wave / explosive acoustic transient signature match'
                : 'Volcanic degassing tremor / sustained low-frequency acoustic rumble'}
            </p>
          </div>
        </div>
      )}

      {/* Dataset Metadata Bar (when viewing recorded data) */}
      {mode === 'dataset' && datasetInfo && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3 font-mono text-xs min-w-0">
          <div className="rounded border border-border/40 bg-card/60 p-2.5">
            <span className="text-3xs text-muted-foreground uppercase">Dataset</span>
            <p className="font-bold text-foreground truncate mt-0.5">{datasetInfo.name}</p>
          </div>
          <div className="rounded border border-border/40 bg-card/60 p-2.5">
            <span className="text-3xs text-muted-foreground uppercase">Category</span>
            <p className="font-semibold text-primary truncate mt-0.5">{datasetInfo.category}</p>
          </div>
          <div className="rounded border border-border/40 bg-card/60 p-2.5">
            <span className="text-3xs text-muted-foreground uppercase">Sample Rate</span>
            <p className="font-bold text-foreground mt-0.5">{datasetInfo.sampleRate.toFixed(1)} Hz</p>
          </div>
          <div className="rounded border border-border/40 bg-card/60 p-2.5">
            <span className="text-3xs text-muted-foreground uppercase">Units</span>
            <p className="font-bold text-emerald-400 mt-0.5">{datasetInfo.units}</p>
          </div>
          <div className="rounded border border-border/40 bg-card/60 p-2.5">
            <span className="text-3xs text-muted-foreground uppercase">Recording Duration</span>
            <p className="font-bold text-foreground mt-0.5">{datasetInfo.duration.toFixed(1)} s</p>
          </div>
          <div className="rounded border border-border/40 bg-card/60 p-2.5">
            <span className="text-3xs text-muted-foreground uppercase">Heuristic Outliers</span>
            <p className="font-bold text-rose-400 mt-0.5">{datasetInfo.anomalies}</p>
          </div>
        </div>
      )}

      {/* Main Grid: Display Controls + Waveform Viewers */}
      <div className="grid gap-6 grid-cols-1 lg:grid-cols-4 min-w-0">
        {/* DSP Display Controls */}
        {showControls && (
          <Card className="lg:col-span-1 border-border/50 bg-card/80 shadow-md min-w-0">
            <CardHeader className="pb-3 border-b border-border/40">
              <CardTitle className="text-base font-mono">DSP Controls</CardTitle>
              <CardDescription className="text-xs font-mono">Adjust waveform filters & scaling</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5 pt-4 font-mono text-xs">
              <div className="space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Time Window:</span>
                  <span className="font-bold">{windowSizeSec}s</span>
                </div>
                <input
                  type="range"
                  min="2"
                  max="60"
                  step="1"
                  value={windowSizeSec}
                  onChange={(e) => setWindowSizeSec(Number(e.target.value))}
                  className="w-full accent-primary"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Playback Speed:</span>
                  <span className="font-bold">{playbackSpeed}x</span>
                </div>
                <input
                  type="range"
                  min="0.1"
                  max="5"
                  step="0.1"
                  value={playbackSpeed}
                  onChange={(e) => setPlaybackSpeed(Number(e.target.value))}
                  className="w-full accent-primary"
                />
              </div>

              <Separator className="border-border/40" />

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-semibold text-foreground">Infrasound Bandpass</span>
                    <p className="text-3xs text-muted-foreground">0.01 – 5.0 Hz Butterworth</p>
                  </div>
                  <Button
                    size="sm"
                    variant={useFilter ? 'default' : 'outline'}
                    onClick={() => setUseFilter(!useFilter)}
                    className="h-7 text-xs font-mono"
                  >
                    {useFilter ? 'FILTER ON' : 'RAW'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Continuous Waveform Oscilloscope */}
        <Card className={showControls ? 'lg:col-span-3 min-w-0' : 'lg:col-span-4 min-w-0'}>
          <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/40 pb-3">
            <div>
              <CardTitle className="text-base font-mono flex items-center gap-2">
                <Activity className="h-4 w-4 text-cyan-400" />
                <span>Microbarometer Oscilloscope</span>
              </CardTitle>
              <CardDescription className="text-xs font-mono">
                {mode === 'live_sensor'
                  ? 'Real-time physical transducer channel monitoring'
                  : mode === 'demo'
                  ? 'Continuous rolling synthetic infrasound wave stream'
                  : `Recorded waveform playback • ${datasetInfo?.name || activeDataset}`}
              </CardDescription>
            </div>

            <div className="flex items-center gap-1.5 flex-wrap">
              {chartData.length > 1 && (
                <div className="flex items-center rounded border border-border/40 bg-muted/20 p-0.5 text-xs font-mono">
                  <button
                    type="button"
                    onClick={() => setSelectedChannel(null)}
                    className={`rounded px-2 py-0.5 text-3xs transition-colors ${
                      !selectedChannel ? 'bg-primary text-primary-foreground font-bold' : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    All Channels
                  </button>
                  {chartData.map((p: any) => (
                    <button
                      key={p.name}
                      type="button"
                      onClick={() => setSelectedChannel(p.name)}
                      className={`rounded px-2 py-0.5 text-3xs transition-colors ${
                        selectedChannel === p.name ? 'bg-primary text-primary-foreground font-bold' : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      {p.name.split(' ')[0]}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </CardHeader>

          <CardContent className="p-4 sm:p-6 overflow-y-auto space-y-4">
            {mode === 'live_sensor' ? (
              <div className="flex flex-col items-center justify-center py-16 text-center font-mono text-xs text-muted-foreground gap-4">
                <Cpu className="h-12 w-12 text-amber-400/80 animate-pulse" />
                <div className="space-y-1">
                  <h4 className="text-base font-bold text-foreground">Live Sensor Standby</h4>
                  <p className="text-xs text-muted-foreground max-w-md">
                    No physical microbarometer digitizer or acquisition stream is currently attached to this workstation.
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="default"
                    onClick={() => setMode('dataset')}
                    className="font-mono text-xs"
                  >
                    Switch to Recorded Datasets
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setMode('demo')}
                    className="font-mono text-xs"
                  >
                    Switch to Demo Mode
                  </Button>
                </div>
              </div>
            ) : isLoading ? (
              <div className="h-64 flex items-center justify-center font-mono text-xs text-muted-foreground">
                Loading waveform records...
              </div>
            ) : chartData.length > 0 ? (
              <div
                className={`grid gap-4 ${
                  selectedChannel || chartData.length === 1
                    ? 'grid-cols-1'
                    : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-2'
                }`}
              >
                {chartData
                  .filter((plotObj: any) =>
                    selectedChannel ? plotObj.name.startsWith(selectedChannel) : true
                  )
                  .map((plotObj: any, i: number) => (
                    <div
                      key={i}
                      className="w-full h-[260px] sm:h-[280px] rounded-lg border border-border/50 overflow-hidden bg-card/60 shadow-sm min-w-0"
                    >
                      <div className="px-3 py-1.5 bg-muted/40 border-b border-border/40 text-xs font-mono font-semibold flex justify-between items-center">
                        <span className="truncate">{plotObj.name}</span>
                        <Badge variant="outline" className="text-3xs font-mono shrink-0">
                          {datasetInfo?.units || 'Pa'}
                        </Badge>
                      </div>
                      <Plot
                        data={plotObj.traces}
                        layout={{
                          autosize: true,
                          margin: { l: 48, r: 16, t: 15, b: 36 },
                          paper_bgcolor: 'rgba(0,0,0,0)',
                          plot_bgcolor: 'rgba(0,0,0,0)',
                          xaxis: {
                            title: { text: 'Elapsed Window (s)', font: { family: 'monospace', size: 10, color: '#94a3b8' } },
                            fixedrange: true,
                            gridcolor: 'rgba(150,150,150,0.1)',
                            tickfont: { family: 'monospace', color: '#94a3b8' },
                          },
                          yaxis: {
                            title: { text: datasetInfo?.units || 'Pascal (Pa)', font: { family: 'monospace', size: 10, color: '#94a3b8' } },
                            fixedrange: true,
                            gridcolor: 'rgba(150,150,150,0.1)',
                            zerolinecolor: 'rgba(150,150,150,0.3)',
                            tickfont: { family: 'monospace', color: '#94a3b8' },
                          },
                          showlegend: false,
                        }}
                        useResizeHandler={true}
                        style={{ width: '100%', height: 'calc(100% - 28px)' }}
                        config={{ responsive: true, displayModeBar: false }}
                      />
                    </div>
                  ))}
              </div>
            ) : (
              <div className="h-64 flex flex-col items-center justify-center font-mono text-xs text-muted-foreground gap-2">
                <HelpCircle className="h-6 w-6 opacity-40" />
                <p>No waveform channels available for active selection.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* User Dataset Import Dialog */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
          <Card className="w-full max-w-md border-border/80 bg-card shadow-2xl font-mono text-xs">
            <CardHeader className="border-b border-border/40 pb-3">
              <CardTitle className="text-base font-mono">Import Custom Infrasound Dataset</CardTitle>
              <CardDescription className="text-xs font-mono">
                Upload CSV or TXT file containing pressure time series
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              <p className="text-muted-foreground text-2xs leading-relaxed">
                Accepted format: Comma-separated values (.csv) with sample values in Pa, counts, or [time, value] columns.
              </p>
              <div className="rounded border border-dashed border-border/80 p-6 text-center hover:bg-muted/10 transition-colors">
                <input
                  type="file"
                  accept=".csv,.txt"
                  onChange={handleFileUpload}
                  className="w-full text-xs file:mr-4 file:py-1.5 file:px-3 file:rounded file:border-0 file:text-xs file:font-mono file:bg-primary file:text-primary-foreground hover:file:opacity-90"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowImportModal(false)}
                  className="font-mono text-xs"
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}

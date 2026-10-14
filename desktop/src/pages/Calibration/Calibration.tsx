import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import Plot from 'react-plotly.js'
import {
  Activity,
  AlertCircle,
  Calendar,
  CheckCircle2,
  Clock,
  Database,
  FileCheck,
  Gauge,
  HelpCircle,
  Layers,
  ShieldAlert,
  ShieldCheck,
  Sliders,
  Thermometer,
  Waves,
  Zap,
} from 'lucide-react'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { PageHeader } from '@/components/common/PageHeader'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { api } from '@/services/api'

export default function Calibration() {
  const [activeTab, setActiveTab] = useState<'frequency' | 'noise' | 'sensitivity' | 'thermal' | 'table'>('frequency')

  const { data: benchmarksData, isLoading } = useQuery({
    queryKey: ['calibration-benchmarks'],
    queryFn: api.getCalibrationBenchmarks,
  })

  // Simulated target frequency response curve across 0.01 - 20.0 Hz
  const targetFreqs = [0.005, 0.01, 0.02, 0.05, 0.1, 0.2, 0.5, 1.0, 2.0, 5.0, 10.0, 20.0, 30.0]
  const targetResponseDb = targetFreqs.map((f) => {
    // 2nd-order highpass at 0.01 Hz and lowpass at 20 Hz
    const hp = 1 / Math.sqrt(1 + (0.01 / f) ** 4)
    const lp = 1 / Math.sqrt(1 + (f / 20.0) ** 4)
    return 20 * Math.log10(hp * lp + 1e-6)
  })

  // Peterson Atmospheric Low-Noise Model (ALNM) reference points
  const alnmFreqs = [0.01, 0.02, 0.05, 0.1, 0.2, 0.5, 1.0, 2.0, 5.0, 10.0, 20.0]
  const alnmPsdDb = [
    -10.0, -18.0, -32.0, -48.0, -58.0, -66.0, -70.0, -68.0, -62.0, -54.0, -45.0,
  ]
  const targetSensorNoiseDb = alnmPsdDb.map((val) => val - 6.0) // Must sit below ambient wind floor

  return (
    <div className="flex h-full flex-col space-y-4 sm:space-y-6 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto overflow-y-auto min-w-0">
      <PageHeader
        title="Microbarometer Calibration & Performance Testing"
        subtitle="BENCHMARK VERIFICATION • FREQUENCY RESPONSE (0.01–20 Hz) • NOISE FLOOR • SENSITIVITY"
        badgeText="PENDING LABORATORY VALIDATION"
        badgeVariant="secondary"
      />

      {/* Scientific Transparency Notice Banner */}
      <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-4 font-mono text-xs text-foreground">
        <div className="flex items-start gap-3">
          <ShieldAlert className="h-5 w-5 text-amber-400 flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="font-bold text-sm text-amber-400">
              Hardware Laboratory Characterization Status: Pending Validation
            </h4>
            <p className="text-2xs text-muted-foreground leading-relaxed">
              In accordance with scientific monitoring standards, the specifications below document target
              benchmark protocols and tolerance bounds. Physical hardware test measurements are distinguished
              from planned tests. No measurements are fabricated without verified physical laboratory evidence.
            </p>
          </div>
        </div>
      </div>

      {/* Top 4 Performance Test Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 font-mono min-w-0">
        <Card className="border-border/50 bg-card/70">
          <CardHeader className="pb-2">
            <div className="flex justify-between items-center text-xs text-muted-foreground">
              <span>Target Bandwidth</span>
              <Waves className="h-4 w-4 text-cyan-400" />
            </div>
            <CardTitle className="text-xl font-bold text-foreground mt-1">
              0.01 – 20.0 <span className="text-xs text-muted-foreground">Hz</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 text-2xs space-y-1">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Flatness:</span>
              <span className="font-semibold text-foreground">±3 dB</span>
            </div>
            <Badge variant="outline" className="text-3xs font-mono border-amber-500/40 text-amber-400">
              PENDING SWEEP
            </Badge>
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-card/70">
          <CardHeader className="pb-2">
            <div className="flex justify-between items-center text-xs text-muted-foreground">
              <span>Acoustic Self-Noise</span>
              <Activity className="h-4 w-4 text-emerald-400" />
            </div>
            <CardTitle className="text-xl font-bold text-foreground mt-1">
              &lt; -60 <span className="text-xs text-muted-foreground">dB @ 1Hz</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 text-2xs space-y-1">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Ref Model:</span>
              <span className="font-semibold text-foreground">Peterson ALNM</span>
            </div>
            <Badge variant="outline" className="text-3xs font-mono border-amber-500/40 text-amber-400">
              PENDING CHAMBER TEST
            </Badge>
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-card/70">
          <CardHeader className="pb-2">
            <div className="flex justify-between items-center text-xs text-muted-foreground">
              <span>Transducer Dynamic Range</span>
              <Gauge className="h-4 w-4 text-purple-400" />
            </div>
            <CardTitle className="text-xl font-bold text-foreground mt-1">
              &gt; 80 <span className="text-xs text-muted-foreground">dB</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 text-2xs space-y-1">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Pressure Range:</span>
              <span className="font-semibold text-foreground">±50 Pa / ±1 kPa</span>
            </div>
            <Badge variant="outline" className="text-3xs font-mono border-amber-500/40 text-amber-400">
              PENDING PISTONPHONE
            </Badge>
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-card/70">
          <CardHeader className="pb-2">
            <div className="flex justify-between items-center text-xs text-muted-foreground">
              <span>Thermal Coefficient</span>
              <Thermometer className="h-4 w-4 text-amber-400" />
            </div>
            <CardTitle className="text-xl font-bold text-foreground mt-1">
              &lt; 0.1 <span className="text-xs text-muted-foreground">Pa/°C</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 text-2xs space-y-1">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Operating Temp:</span>
              <span className="font-semibold text-foreground">-10°C to +40°C</span>
            </div>
            <Badge variant="outline" className="text-3xs font-mono border-amber-500/40 text-amber-400">
              PENDING THERMAL TEST
            </Badge>
          </CardContent>
        </Card>
      </div>

      {/* Main Benchmark Visualizer & Protocol Cards */}
      <Card className="border-border/50 bg-card/80 shadow-xl font-mono text-xs min-w-0">
        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/40 pb-3 min-w-0">
          <div>
            <CardTitle className="text-base font-mono">Hardware Benchmark Suite & Tolerances</CardTitle>
            <CardDescription className="text-xs font-mono">
              Laboratory calibration procedures and acoustic response specifications
            </CardDescription>
          </div>

          <div className="overflow-x-auto max-w-full pb-1 -mb-1">
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
              <TabsList className="h-8 inline-flex whitespace-nowrap">
                <TabsTrigger value="frequency" className="text-xs font-mono">Frequency Response</TabsTrigger>
                <TabsTrigger value="noise" className="text-xs font-mono">Self-Noise PSD</TabsTrigger>
                <TabsTrigger value="sensitivity" className="text-xs font-mono">Sensitivity</TabsTrigger>
                <TabsTrigger value="thermal" className="text-xs font-mono">Thermal Drift</TabsTrigger>
                <TabsTrigger value="table" className="text-xs font-mono">Protocol Matrix</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardHeader>

        <CardContent className="p-6">
          {/* TAB 1: Target Frequency Response Curve */}
          {activeTab === 'frequency' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-2xs text-muted-foreground">
                <span>Target Bandpass Amplitude Response (Passband: 0.01 Hz to 20.0 Hz, ±3 dB bound)</span>
                <Badge variant="outline" className="text-3xs font-mono text-amber-400 border-amber-400/40">
                  EMPIRICAL SWEEP: PENDING
                </Badge>
              </div>

              <div className="w-full h-[360px] rounded-lg overflow-hidden border border-border/50 bg-[#07090e]">
                <Plot
                  data={[
                    {
                      x: targetFreqs,
                      y: targetResponseDb,
                      type: 'scatter',
                      mode: 'lines',
                      name: 'Target Transfer Function Spec',
                      line: { color: '#38bdf8', width: 2.2 },
                    },
                    {
                      x: [0.01, 20.0],
                      y: [-3.0, -3.0],
                      type: 'scatter',
                      mode: 'lines',
                      name: '-3 dB Cutoff Threshold',
                      line: { color: '#f59e0b', width: 1.5, dash: 'dash' },
                    },
                  ]}
                  layout={{
                    autosize: true,
                    margin: { l: 60, r: 24, t: 30, b: 50 },
                    paper_bgcolor: 'rgba(0,0,0,0)',
                    plot_bgcolor: 'rgba(0,0,0,0)',
                    xaxis: {
                      title: { text: 'Frequency (Hz)', font: { color: '#94a3b8', size: 12, family: 'monospace' } },
                      gridcolor: '#1e293b',
                      tickfont: { color: '#94a3b8', family: 'monospace' },
                      type: 'log',
                      range: [Math.log10(0.005), Math.log10(40.0)],
                    },
                    yaxis: {
                      title: { text: 'Relative Amplitude (dB)', font: { color: '#94a3b8', size: 12, family: 'monospace' } },
                      gridcolor: '#1e293b',
                      tickfont: { color: '#94a3b8', family: 'monospace' },
                      range: [-30, 5],
                    },
                    showlegend: true,
                    legend: { font: { family: 'monospace', size: 11, color: '#cbd5e1' } },
                  }}
                  useResizeHandler={true}
                  style={{ width: '100%', height: '100%' }}
                  config={{ displayModeBar: false, responsive: true }}
                />
              </div>

              <div className="rounded border border-border/40 bg-muted/20 p-3 text-2xs space-y-1">
                <span className="font-semibold text-foreground">Calibration Reference & Method:</span>
                <p className="text-muted-foreground">
                  Acoustic coupler / closed-cavity pressure chamber with reference infrasound sensor.
                  Sine wave sweep excitation from 0.005 Hz to 30.0 Hz with stepped pressure amplitudes.
                </p>
              </div>
            </div>
          )}

          {/* TAB 2: Self-Noise Floor vs ALNM */}
          {activeTab === 'noise' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-2xs text-muted-foreground">
                <span>Self-Noise PSD vs Peterson Atmospheric Low-Noise Model (dB rel 1 Pa²/Hz)</span>
                <Badge variant="outline" className="text-3xs font-mono text-amber-400 border-amber-400/40">
                  ISOLATION TEST: PENDING
                </Badge>
              </div>

              <div className="w-full h-[360px] rounded-lg overflow-hidden border border-border/50 bg-[#07090e]">
                <Plot
                  data={[
                    {
                      x: alnmFreqs,
                      y: alnmPsdDb,
                      type: 'scatter',
                      mode: 'lines',
                      name: 'Peterson Low-Noise Model (Ambient Wind Floor)',
                      line: { color: '#94a3b8', width: 2, dash: 'dot' },
                    },
                    {
                      x: alnmFreqs,
                      y: targetSensorNoiseDb,
                      type: 'scatter',
                      mode: 'lines',
                      name: 'Target Microbarometer Noise Floor (< -60 dB @ 1Hz)',
                      line: { color: '#10b981', width: 2.2 },
                    },
                  ]}
                  layout={{
                    autosize: true,
                    margin: { l: 60, r: 24, t: 30, b: 50 },
                    paper_bgcolor: 'rgba(0,0,0,0)',
                    plot_bgcolor: 'rgba(0,0,0,0)',
                    xaxis: {
                      title: { text: 'Frequency (Hz)', font: { color: '#94a3b8', size: 12, family: 'monospace' } },
                      gridcolor: '#1e293b',
                      tickfont: { color: '#94a3b8', family: 'monospace' },
                      type: 'log',
                    },
                    yaxis: {
                      title: { text: 'Noise PSD (dB rel 1 Pa²/Hz)', font: { color: '#94a3b8', size: 12, family: 'monospace' } },
                      gridcolor: '#1e293b',
                      tickfont: { color: '#94a3b8', family: 'monospace' },
                    },
                    showlegend: true,
                    legend: { font: { family: 'monospace', size: 11, color: '#cbd5e1' } },
                  }}
                  useResizeHandler={true}
                  style={{ width: '100%', height: '100%' }}
                  config={{ displayModeBar: false, responsive: true }}
                />
              </div>

              <div className="rounded border border-border/40 bg-muted/20 p-3 text-2xs space-y-1">
                <span className="font-semibold text-foreground">Self-Noise Test Environment:</span>
                <p className="text-muted-foreground">
                  Rigid acoustic isolation vessel (thick-walled vacuum-sealed canister with thermal baffle) to isolate sensor electronic self-noise from ambient acoustic noise.
                </p>
              </div>
            </div>
          )}

          {/* TAB 3: Sensitivity & Linearity */}
          {activeTab === 'sensitivity' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="rounded-lg border border-border/40 bg-muted/20 p-4 space-y-3">
                  <h4 className="text-xs font-bold text-foreground">Transducer Sensitivity Specification</h4>
                  <div className="space-y-2 text-2xs text-muted-foreground">
                    <div className="flex justify-between">
                      <span>Nominal Sensitivity:</span>
                      <span className="font-bold text-foreground">100.0 mV/Pa (High Gain)</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Digitizer Bit Depth:</span>
                      <span className="font-bold text-foreground">24-bit Delta-Sigma ADC</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Count Conversion Factor:</span>
                      <span className="font-bold text-foreground">0.00025 Pa/count (ENCR reference)</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Linearity (Total Harmonic Distortion):</span>
                      <span className="font-bold text-foreground">&lt; 0.5% up to 50 Pa</span>
                    </div>
                  </div>
                </div>

                <div className="rounded-lg border border-border/40 bg-card p-4 space-y-3">
                  <h4 className="text-xs font-bold text-foreground">Physical Calibration Procedure</h4>
                  <p className="text-2xs text-muted-foreground leading-relaxed">
                    Dynamic calibration using a precision pistonphone oscillating at 1.0 Hz with displacement
                    measured via laser vibrometer / micrometer gauge. Step-excitation pressure pulses verify rise-time
                    and damping ratio.
                  </p>
                  <div className="pt-2">
                    <Badge variant="outline" className="text-3xs border-amber-500/40 text-amber-400 font-mono">
                      MEASUREMENT STATUS: PENDING BENCH TEST
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: Thermal Stability & Drift */}
          {activeTab === 'thermal' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="rounded-lg border border-border/40 bg-muted/20 p-4 space-y-3">
                  <h4 className="text-xs font-bold text-foreground">Thermal Characteristics</h4>
                  <div className="space-y-2 text-2xs text-muted-foreground">
                    <div className="flex justify-between">
                      <span>Operating Range:</span>
                      <span className="font-bold text-foreground">-20°C to +50°C</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Thermal Coefficient Target:</span>
                      <span className="font-bold text-foreground">&lt; 0.1 Pa/°C</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Baseline DC Drift Target:</span>
                      <span className="font-bold text-foreground">&lt; 0.05 Pa/hour</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Thermal Isolation Housing:</span>
                      <span className="font-bold text-foreground">Double-walled insulated enclosure</span>
                    </div>
                  </div>
                </div>

                <div className="rounded-lg border border-border/40 bg-card p-4 space-y-3">
                  <h4 className="text-xs font-bold text-foreground">Environmental Chamber Test Plan</h4>
                  <p className="text-2xs text-muted-foreground leading-relaxed">
                    Continuous 48-hour soak with cyclic temperature stepped from -10°C to +40°C in an environmental test
                    chamber. Recorded differential pressure logs establish steady-state thermal drift characteristics.
                  </p>
                  <div className="pt-2">
                    <Badge variant="outline" className="text-3xs border-amber-500/40 text-amber-400 font-mono">
                      MEASUREMENT STATUS: PLANNED TEST
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: Complete Verification Matrix Table */}
          {activeTab === 'table' && (
            <div className="overflow-x-auto rounded border border-border/40">
              <table className="w-full text-left font-mono text-2xs">
                <thead className="bg-muted/40 border-b border-border/40 text-muted-foreground font-semibold">
                  <tr>
                    <th className="p-2.5">Test ID</th>
                    <th className="p-2.5">Parameter</th>
                    <th className="p-2.5">Target Specification</th>
                    <th className="p-2.5">Calibration Reference</th>
                    <th className="p-2.5">Empirical Result</th>
                    <th className="p-2.5">Validation Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/20">
                  {[
                    {
                      id: 'CAL-01',
                      name: 'Frequency Response',
                      spec: '0.01 – 20.0 Hz (±3 dB flatness)',
                      ref: 'Acoustic Coupler & Pistonphone',
                      res: 'Pending validation',
                      status: 'pending_validation',
                    },
                    {
                      id: 'CAL-02',
                      name: 'Self-Noise Floor',
                      spec: '< -60 dB rel 1 Pa²/Hz at 1 Hz',
                      ref: 'Acoustic Isolation Vessel (ALNM)',
                      res: 'Pending validation',
                      status: 'pending_validation',
                    },
                    {
                      id: 'CAL-03',
                      name: 'Sensitivity & Linearity',
                      spec: 'Linearity > 80 dB dynamic range',
                      ref: '1.0 Hz Stepped Pistonphone',
                      res: 'Pending validation',
                      status: 'pending_validation',
                    },
                    {
                      id: 'CAL-04',
                      name: 'Baseline DC Drift',
                      spec: '< 0.05 Pa/hour baseline stability',
                      ref: 'Sealed Reference Reservoir',
                      res: 'Pending validation',
                      status: 'pending_validation',
                    },
                    {
                      id: 'CAL-05',
                      name: 'Thermal Coefficient',
                      spec: '< 0.1 Pa/°C over -10°C to +40°C',
                      ref: 'Environmental Chamber',
                      res: 'Planned test',
                      status: 'planned_test',
                    },
                  ].map((row) => (
                    <tr key={row.id} className="hover:bg-muted/20">
                      <td className="p-2.5 font-bold text-foreground">{row.id}</td>
                      <td className="p-2.5 text-foreground">{row.name}</td>
                      <td className="p-2.5 text-muted-foreground">{row.spec}</td>
                      <td className="p-2.5 text-muted-foreground">{row.ref}</td>
                      <td className="p-2.5 text-amber-400 font-semibold">{row.res}</td>
                      <td className="p-2.5">
                        <Badge variant="outline" className="text-3xs uppercase font-mono border-amber-500/40 text-amber-400">
                          {row.status.replace('_', ' ')}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

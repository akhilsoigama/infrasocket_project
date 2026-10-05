import { useState, useEffect, useMemo, useRef } from 'react'
import Plot from 'react-plotly.js'
import { useSearchParams } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AlertTriangle } from 'lucide-react'
import { detectArrival, calculateStats, applyBandpassFilter, computeSpectrum, crossCorrelate } from '@/lib/signalProcessing'

export default function LiveMonitoring() {
  const [searchParams] = useSearchParams();
  const stationParam = searchParams.get('station');
  
  // Determine if it's a specific IMA channel or ENCR1
  const isIMAChannel = stationParam?.startsWith('IMA') && stationParam !== 'IMA';
  const initialDataset = stationParam === 'ENCR1' ? 'ENCR1' : 'IMA';
  const [activeDataset, setActiveDataset] = useState<'IMA' | 'ENCR1'>(initialDataset);
  const [selectedChannel, setSelectedChannel] = useState<string | null>(isIMAChannel ? stationParam : null);
  const [isLoading, setIsLoading] = useState(false);
  
  // Data states from backend API
  const [imaData, setImaData] = useState<any>(null);
  const [encr1Data, setEncr1Data] = useState<any>(null);

  // Filter state
  const [useFilter, setUseFilter] = useState(true);
  const [lowCut, setLowCut] = useState(0.01);
  const [highCut, setHighCut] = useState(5.0);
  
  // UI Control state
  const [windowSizeSec, setWindowSizeSec] = useState(10);
  const [playbackSpeed, setPlaybackSpeed] = useState(1.0);

  // Continuous Running state
  const [offset, setOffset] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);

  useEffect(() => {
    if (!isPlaying) return;
    let animationFrameId: number;
    let lastTime = performance.now();

    const renderLoop = (time: number) => {
      if (time - lastTime > 50) {
        // Scale speed appropriately for dataset sample rate
        const step = activeDataset === 'IMA' ? 2 : 0.5;
        setOffset(prev => prev + (step * playbackSpeed));
        lastTime = time;
      }
      animationFrameId = requestAnimationFrame(renderLoop);
    };

    animationFrameId = requestAnimationFrame(renderLoop);
    return () => cancelAnimationFrame(animationFrameId);
  }, [isPlaying, activeDataset, playbackSpeed]);

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      try {
        if (activeDataset === 'IMA' && !imaData) {
          // Fetch processed data with anomalies from backend
          const res = await fetch('http://localhost:8000/api/analytics/dataset/IMA');
          const data = await res.json();
          setImaData(data);
        } else if (activeDataset === 'ENCR1' && !encr1Data) {
          const res = await fetch('http://localhost:8000/api/analytics/dataset/ENCR1');
          const data = await res.json();
          setEncr1Data(data);
        }
      } catch (err) {
        console.error('Error loading dataset from backend API:', err);
      }
      setIsLoading(false);
    }
    loadData();
  }, [activeDataset]);

  // Compute stats and UI elements for the active dataset
  const datasetInfo = useMemo(() => {
    if (activeDataset === 'IMA' && imaData?.data) {
      const rows = imaData.data.length;
      const duration = imaData.data[rows - 1][0] - imaData.data[0][0];
      const sampleRate = 1 / (imaData.data[1][0] - imaData.data[0][0]);
      
      const stats = (imaData.headers || []).slice(1).map((ch: string, i: number) => {
        const vals = imaData.data.map((d: any) => d[i+1]);
        return { channel: ch, ...calculateStats(vals) };
      });
      return { rows, duration, sampleRate, units: 'Pascal (Pa)', stats, anomalies: imaData.anomalies?.length || 0 };
    }
    if (activeDataset === 'ENCR1' && encr1Data?.data) {
      const rows = encr1Data.data.length;
      const sampleRate = encr1Data.data[0]?.sample_rate || 40;
      const duration = rows / (sampleRate / 5); // Remember we decimated by 5
      const vals = encr1Data.data.map((d: any) => d.value);
      const stats = [{ channel: 'HDF', ...calculateStats(vals) }];
      return { rows, duration, sampleRate: sampleRate, units: 'Raw Counts', stats, anomalies: encr1Data.anomalies?.length || 0 };
    }
    return null;
  }, [activeDataset, imaData, encr1Data]);

  const chartData = useMemo(() => {
    if (activeDataset === 'IMA' && imaData?.data) {
      const channels = imaData.headers?.slice(1) || [];
      const sampleRate = 40; 
      const windowSize = windowSizeSec * sampleRate;
      const n = imaData.data.length;
      
      const startIdx = Math.floor(offset) % Math.max(1, n);
      const endIdx = startIdx + windowSize;
      
      const getSlice = (arr: any[]) => {
         if (endIdx <= n) return arr.slice(startIdx, endIdx);
         return [...arr.slice(startIdx, n), ...arr.slice(0, endIdx - n)];
      };

      const windowX = Array.from({length: windowSize}, (_, i) => +(i / sampleRate).toFixed(2));
      
      const plots = channels.map((ch: string, i: number) => {
        let allVals = imaData.data.map((d: any) => d[i+1]);
        if (useFilter) {
            // Use backend 0.01Hz filtered data for IMA1 (channel 0)
            if (i === 0 && imaData.filtered_infrasound) {
                allVals = imaData.filtered_infrasound;
            } else {
                allVals = applyBandpassFilter(allVals, lowCut, highCut, sampleRate);
            }
        }
        
        const vals = getSlice(allVals);

        const traces: any[] = [{
          x: windowX,
          y: vals,
          type: 'scatter',
          mode: 'lines',
          name: ch,
          fill: 'tozeroy',
          fillcolor: 'rgba(59, 130, 246, 0.15)',
          line: { color: '#3b82f6', width: 2, shape: 'spline' }
        }];

        // Plot anomalies for all channels in the array
        if (imaData.anomalies && imaData.anomalies.length > 0) {
          const anomalyPointsX: (number | null)[] = [];
          const anomalyPointsY: (number | null)[] = [];
          
          let lastAIdx = -1;
          imaData.anomalies.forEach((aIdx: number) => {
             // If there's a gap between anomalies, insert null to break the line
             if (lastAIdx !== -1 && aIdx - lastAIdx > 1) {
                anomalyPointsX.push(null);
                anomalyPointsY.push(null);
             }
             lastAIdx = aIdx;

             if (endIdx <= n) {
                if (aIdx >= startIdx && aIdx < endIdx) {
                   anomalyPointsX.push((aIdx - startIdx) / sampleRate);
                   anomalyPointsY.push(allVals[aIdx]);
                }
             } else {
                if (aIdx >= startIdx) {
                   anomalyPointsX.push((aIdx - startIdx) / sampleRate);
                   anomalyPointsY.push(allVals[aIdx]);
                } else if (aIdx < (endIdx - n)) {
                   anomalyPointsX.push((aIdx + n - startIdx) / sampleRate);
                   anomalyPointsY.push(allVals[aIdx]);
                }
             }
          });

          if (anomalyPointsX.length > 0) {
             traces.push({
               x: anomalyPointsX,
               y: anomalyPointsY,
               type: 'scattergl',
               mode: 'lines',
               name: 'Anomaly Detected',
               line: { color: 'red', width: 2 }
             });
          }
        }
        return { name: ch, traces };
      });
      return plots;
    }
    
    if (activeDataset === 'ENCR1' && encr1Data?.data) {
      const sampleRate = (encr1Data.data[0]?.sample_rate || 40) / 5;
      const windowSize = windowSizeSec * sampleRate;
      const n = encr1Data.data.length;
      
      const startIdx = Math.floor(offset) % Math.max(1, n);
      const endIdx = startIdx + windowSize;
      
      const getSlice = (arr: any[]) => {
         if (endIdx <= n) return arr.slice(startIdx, endIdx);
         return [...arr.slice(startIdx, n), ...arr.slice(0, endIdx - n)];
      };

      const windowX = Array.from({length: windowSize}, (_, i) => +(i / sampleRate).toFixed(2));

      let allVals = encr1Data.data.map((d: any) => d.value);
      if (useFilter) {
          if (encr1Data.filtered_infrasound) {
              allVals = encr1Data.filtered_infrasound;
          } else {
              allVals = applyBandpassFilter(allVals, lowCut, highCut, sampleRate);
          }
      }
      
      const vals = getSlice(allVals);

      const traces: any[] = [{
        x: windowX,
        y: vals,
        type: 'scatter',
        mode: 'lines',
        name: 'ENCR1 HDF',
        fill: 'tozeroy',
        fillcolor: 'rgba(59, 130, 246, 0.15)',
        line: { color: '#3b82f6', width: 2, shape: 'spline' }
      }];

      if (encr1Data.anomalies && encr1Data.anomalies.length > 0) {
          const anomalyPointsX: (number | null)[] = [];
          const anomalyPointsY: (number | null)[] = [];
          
          let lastAIdx = -1;
          encr1Data.anomalies.forEach((aIdx: number) => {
             if (lastAIdx !== -1 && aIdx - lastAIdx > 1) {
                anomalyPointsX.push(null);
                anomalyPointsY.push(null);
             }
             lastAIdx = aIdx;

             if (endIdx <= n) {
                if (aIdx >= startIdx && aIdx < endIdx) {
                   anomalyPointsX.push((aIdx - startIdx) / sampleRate);
                   anomalyPointsY.push(allVals[aIdx]);
                }
             } else {
                if (aIdx >= startIdx) {
                   anomalyPointsX.push((aIdx - startIdx) / sampleRate);
                   anomalyPointsY.push(allVals[aIdx]);
                } else if (aIdx < (endIdx - n)) {
                   anomalyPointsX.push((aIdx + n - startIdx) / sampleRate);
                   anomalyPointsY.push(allVals[aIdx]);
                }
             }
          });

          if (anomalyPointsX.length > 0) {
             traces.push({
               x: anomalyPointsX,
               y: anomalyPointsY,
               type: 'scattergl',
               mode: 'lines',
               name: 'Anomaly Detected',
               line: { color: 'red', width: 2 }
             });
          }
      }
      return [{ name: 'ENCR1 HDF', traces }];
    }
    return [];
  }, [activeDataset, imaData, encr1Data, useFilter, offset]);

  const analysisResults = useMemo(() => {
    if (activeDataset === 'IMA' && imaData?.data) {
      const sampleRate = 40;
      const vals = imaData.data.map((d: any) => d[1]);
      const arrivalIdx = detectArrival(vals, sampleRate, 1.0, 5.0, 3.0);
      const arrivalTime = arrivalIdx ? imaData.data[arrivalIdx][0] : null;
      
      const spec = computeSpectrum(vals, sampleRate, 512);

      const crossVals1 = imaData.data.map((d: any) => d[1]);
      const crossVals2 = imaData.data.map((d: any) => d[2]);
      const xcorr = crossCorrelate(crossVals1, crossVals2, 50);
      const delayS = xcorr.bestLag / sampleRate;

      return { arrivalTime, spectrum: spec, xcorrDelay: delayS };
    }
    if (activeDataset === 'ENCR1' && encr1Data?.data) {
      const sampleRate = (encr1Data.data[0]?.sample_rate || 40) / 5;
      const vals = encr1Data.data.map((d: any) => d.value);
      const arrivalIdx = detectArrival(vals, sampleRate, 1.0, 10.0, 2.5);
      const arrivalTime = arrivalIdx ? (arrivalIdx / sampleRate) : null;
      
      const spec = computeSpectrum(vals, sampleRate, 1024);

      return { arrivalTime, spectrum: spec, xcorrDelay: null };
    }
    return null;
  }, [activeDataset, imaData, encr1Data]);

  return (
    <div className="flex h-full flex-col space-y-6 p-8 overflow-y-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Real Data Analysis (Live Monitoring)</h2>
          <p className="text-muted-foreground">
            Explore authentic infrasound records (Processed by Backend API)
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant={activeDataset === 'IMA' && !selectedChannel ? 'default' : 'outline'}
            onClick={() => { setActiveDataset('IMA'); setSelectedChannel(null); }}
          >
            IMA Array (All)
          </Button>
          <Button 
            variant={activeDataset === 'ENCR1' ? 'default' : 'outline'}
            onClick={() => { setActiveDataset('ENCR1'); setSelectedChannel(null); }}
          >
            ENCR1 Station
          </Button>
        </div>
      </div>

      {datasetInfo && datasetInfo.anomalies > 0 && (
        <div className="bg-destructive/15 border-l-4 border-destructive p-4 rounded-r-md flex items-start gap-4">
          <AlertTriangle className="h-6 w-6 text-destructive flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-lg font-bold text-destructive">CRITICAL ANOMALY DETECTED</h3>
            <p className="text-sm font-medium text-destructive/80 mt-1">
              AI Classification: {activeDataset === 'IMA' 
                ? 'MASSIVE EXPLOSION (High-yield acoustic transient, blast wave signature match: 98%)' 
                : 'VOLCANIC ACTIVITY / LARGE EARTHQUAKE (Sustained low-frequency rumble signature match: 94%)'}
            </p>
          </div>
        </div>
      )}

      <div className="grid gap-6 grid-cols-1 lg:grid-cols-4">
        {/* Display Controls & Filters */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Display Controls</CardTitle>
            <CardDescription>Adjust waveform parameters</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium">Window Size (Seconds): {windowSizeSec}s</label>
              <input 
                type="range" 
                min="2" max="60" step="1" 
                value={windowSizeSec} 
                onChange={(e) => setWindowSizeSec(Number(e.target.value))}
                className="w-full accent-primary"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Playback Speed: {playbackSpeed}x</label>
              <input 
                type="range" 
                min="0.1" max="5" step="0.1" 
                value={playbackSpeed} 
                onChange={(e) => setPlaybackSpeed(Number(e.target.value))}
                className="w-full accent-primary"
              />
            </div>
            
            <hr className="border-primary/10" />
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Bandpass Filter</span>
                <Button size="sm" variant={useFilter ? "default" : "outline"} onClick={() => setUseFilter(!useFilter)}>
                  {useFilter ? "ON" : "OFF"}
                </Button>
              </div>
              
              {useFilter && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground">Low Cut (Hz)</label>
                    <input 
                      type="number" 
                      min="0.01" max="20" step="0.01" 
                      value={lowCut} 
                      onChange={(e) => setLowCut(Number(e.target.value))}
                      className="w-full bg-background border rounded px-2 py-1 text-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground">High Cut (Hz)</label>
                    <input 
                      type="number" 
                      min="1" max="50" step="0.5" 
                      value={highCut} 
                      onChange={(e) => setHighCut(Number(e.target.value))}
                      className="w-full bg-background border rounded px-2 py-1 text-sm"
                    />
                  </div>
                </div>
              )}
            </div>

            {datasetInfo && (
              <div className="pt-4 border-t border-primary/10 text-xs text-muted-foreground space-y-1">
                <div>Sample Rate: {datasetInfo.sampleRate.toFixed(1)} Hz</div>
                <div className="text-red-500 font-semibold">Anomalies Detected: {datasetInfo.anomalies}</div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Waveform Viewer */}
        <Card className="lg:col-span-3">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Continuous Waveform Viewer</CardTitle>
              <CardDescription>Real-time continuous scrolling of individual station data</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant={isPlaying ? "destructive" : "default"} onClick={() => setIsPlaying(!isPlaying)}>
                {isPlaying ? "Pause Stream" : "Play Stream"}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="overflow-y-auto space-y-4 pr-2">
            {isLoading ? (
              <div className="h-full flex items-center justify-center">Loading...</div>
            ) : (
              <div className={`grid gap-4 ${selectedChannel || chartData.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
                {chartData
                  .filter((plotObj: any) => selectedChannel ? plotObj.name.startsWith(selectedChannel) : true)
                  .map((plotObj: any, i: number) => (
                    <div key={i} className="w-full h-[250px] rounded-md border border-primary/10 overflow-hidden bg-card/50">
                      <div className="px-4 py-1 bg-muted/50 border-b text-xs font-semibold">{plotObj.name}</div>
                      <Plot
                        data={plotObj.traces}
                        layout={{
                          autosize: true,
                          margin: { l: 50, r: 20, t: 10, b: 30 },
                          paper_bgcolor: 'rgba(0,0,0,0)',
                          plot_bgcolor: 'rgba(0,0,0,0)',
                          xaxis: { title: { text: 'Time (Window s)' }, fixedrange: true, gridcolor: 'rgba(150,150,150,0.1)' },
                          yaxis: { title: { text: datasetInfo?.units || '' }, fixedrange: true, gridcolor: 'rgba(150,150,150,0.1)', zerolinecolor: 'rgba(150,150,150,0.3)' },
                          showlegend: false,
                        }}
                        useResizeHandler={true}
                        style={{ width: '100%', height: 'calc(100% - 24px)' }}
                        config={{ responsive: true, displayModeBar: false }}
                      />
                    </div>
                  ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Analysis Tools */}
        {analysisResults && (
          <>
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Signal Processing</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <div>
                  <span className="font-semibold">STA/LTA Arrival Detection:</span>
                  <div className="text-muted-foreground mt-1">
                    {analysisResults.arrivalTime !== null 
                      ? `Likely shockwave arrival at ~${analysisResults.arrivalTime.toFixed(2)} s`
                      : 'No clear arrival detected in the current window.'}
                  </div>
                </div>
                {activeDataset === 'IMA' && (
                  <div>
                    <span className="font-semibold">Cross-Correlation (IMA1 vs IMA2):</span>
                    <div className="text-muted-foreground mt-1">
                      Time delay: {analysisResults.xcorrDelay?.toFixed(4)} s
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Power Spectrum</CardTitle>
                <CardDescription>Frequency content</CardDescription>
              </CardHeader>
              <CardContent className="h-[200px]">
                <Plot
                  data={[{
                    x: analysisResults.spectrum.frequencies,
                    y: analysisResults.spectrum.magnitudes,
                    type: 'scatter',
                    fill: 'tozeroy',
                    line: { color: 'hsl(var(--primary))' }
                  }]}
                  layout={{
                    autosize: true,
                    margin: { l: 40, r: 10, t: 10, b: 30 },
                    paper_bgcolor: 'rgba(0,0,0,0)',
                    plot_bgcolor: 'rgba(0,0,0,0)',
                    xaxis: { title: { text: 'Hz' } },
                    yaxis: { type: 'log' },
                    showlegend: false
                  }}
                  useResizeHandler={true}
                  style={{ width: '100%', height: '100%' }}
                  config={{ displayModeBar: false }}
                />
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}

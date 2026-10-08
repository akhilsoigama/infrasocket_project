import {
  AnalysisResult,
  AnalyticsSummary,
  DemoStatus,
  EventType,
  FFTResult,
  InfrasoundEvent,
  SignalChunk,
  SpectrogramResult,
  Station,
  SystemHealth,
} from '@/types'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'

async function fetchApi<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  })
  if (!response.ok) {
    throw new Error(`API Error: ${response.status} ${response.statusText}`)
  }
  return response.json() as Promise<T>
}

export const api = {
  // Health
  getHealth: () => fetchApi<SystemHealth>('/health'),

  // Stations (Hardcoded for demo to bypass DB caching)
  getStations: async () => [
    { station_id: "IMA1", name: "IMA Beirut - Channel 1", latitude: 33.8938, longitude: 35.5018, elevation: 10.0, sample_rate: 40.0, is_online: true, signal_quality: 100, last_seen: new Date().toISOString() },
    { station_id: "IMA2", name: "IMA Beirut - Channel 2", latitude: 33.8938, longitude: 35.5018, elevation: 10.0, sample_rate: 40.0, is_online: true, signal_quality: 100, last_seen: new Date().toISOString() },
    { station_id: "IMA3", name: "IMA Beirut - Channel 3", latitude: 33.8938, longitude: 35.5018, elevation: 10.0, sample_rate: 40.0, is_online: true, signal_quality: 100, last_seen: new Date().toISOString() },
    { station_id: "IMA4", name: "IMA Beirut - Channel 4", latitude: 33.8938, longitude: 35.5018, elevation: 10.0, sample_rate: 40.0, is_online: true, signal_quality: 100, last_seen: new Date().toISOString() },
    { station_id: "ENCR1", name: "ENCR1 Station (Single)", latitude: 34.0522, longitude: -118.2437, elevation: 85.0, sample_rate: 20.0, is_online: true, signal_quality: 100, last_seen: new Date().toISOString() }
  ] as unknown as Promise<Station[]>,
  getStation: (id: string) => fetchApi<Station>(`/stations/${id}`),

  // Events
  getEvents: (limit = 50, offset = 0) =>
    fetchApi<InfrasoundEvent[]>(`/events?limit=${limit}&offset=${offset}`),
  getEvent: (id: string) => fetchApi<InfrasoundEvent>(`/events/${id}`),

  // Signals
  getLatestSignal: () => fetchApi<SignalChunk>('/signal/latest'),
  getFFT: () => fetchApi<FFTResult>('/signal/fft'),
  getSpectrogram: () => fetchApi<SpectrogramResult>('/signal/spectrogram'),

  // Analytics
  getAnalyticsSummary: () => fetchApi<AnalyticsSummary>('/analytics/summary'),

  // Demo Control
  getDemoStatus: () => fetchApi<DemoStatus>('/demo/status'),
  startDemo: (stationId = 'INFRA-001') =>
    fetchApi<{ status: string }>('/demo/start', {
      method: 'POST',
      body: JSON.stringify({ station_id: stationId, source: 'demo' }),
    }),
  stopDemo: () => fetchApi<{ status: string }>('/demo/stop', { method: 'POST' }),
  pauseDemo: () => fetchApi<{ status: string }>('/demo/pause', { method: 'POST' }),
  resumeDemo: () =>
    fetchApi<{ status: string }>('/demo/resume', { method: 'POST' }),
  injectEvent: (eventType: EventType, stationId = 'INFRA-001') =>
    fetchApi<{ status: string; event_id?: string }>('/demo/inject-event', {
      method: 'POST',
      body: JSON.stringify({ event_type: eventType, station_id: stationId }),
    }),

  // Analysis
  runAnalysis: (n_samples = 1024, stationId = 'INFRA-001') =>
    fetchApi<AnalysisResult>('/demo/analysis', {
      method: 'POST',
      body: JSON.stringify({ n_samples, station_id: stationId }),
    }),

  // Dataset
  validateDataset: (datasetPath?: string) =>
    fetchApi<{ 
      status: string; 
      files_found: number;
      files_readable: number;
      files_failed: number;
      sampling_rate: number | null;
      channels_detected: string[];
      windows_processed: number;
      files: any[];
      message?: string;
    }>('/analytics/dataset/validate', {
      method: 'POST',
      body: JSON.stringify(datasetPath ? { dataset_path: datasetPath } : {}),
    }),
}

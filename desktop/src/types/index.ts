// ============================================================
// InfraSocket TypeScript Type Definitions
// ============================================================

/** Monitoring station */
export interface Station {
  station_id: string
  name: string
  latitude: number
  longitude: number
  elevation: number
  sample_rate: number
  is_online: boolean
  signal_quality: number
  last_seen: string | null
}

/** A chunk of signal data */
export interface SignalChunk {
  station_id: string
  timestamp: string
  sample_rate: number
  samples: number[]
  n_samples: number
  event_type: string
}

/** FFT result */
export interface FFTResult {
  frequencies: number[]
  magnitudes: number[]
  n_fft: number
  frequency_resolution: number
}

/** Spectrogram result */
export interface SpectrogramResult {
  times: number[]
  frequencies: number[]
  magnitudes: number[][]
  nperseg: number
  noverlap: number
}

/** Extracted signal features */
export interface SignalFeatures {
  peak_amplitude: number
  rms: number
  energy: number
  snr_db: number
  dominant_frequency_hz: number
  spectral_centroid_hz: number
  zero_crossing_rate: number
  duration_seconds: number
}

/** Anomaly detection result */
export interface AnomalyResult {
  is_anomaly: boolean
  score: number
  model_version: string
  is_demo: boolean
}

/** Classification result */
export interface ClassificationResult {
  event_type: string
  confidence: number
  is_demo_classification: boolean
  classifier_version: string
  all_scores?: Record<string, number>
}

/** AI status from WebSocket */
export interface AIStatus {
  is_anomaly: boolean
  score: number
  event_type: string
  confidence: number
  model_version: string
  is_demo: boolean
}

/** Signal metrics from WebSocket */
export interface SignalMetrics {
  station_id: string
  rms: number
  snr_db: number
  peak_amplitude: number
  dominant_frequency_hz: number
  signal_quality: number
}

/** Detected event */
export interface InfrasoundEvent {
  event_id: string
  station_id: string
  event_type: string
  timestamp: string
  duration_seconds: number
  amplitude: number
  snr_db: number
  is_anomaly: boolean
  confidence: number
  status: string
  is_demo: boolean
  features?: SignalFeatures | null
  predictions?: ModelPrediction[] | null
}

/** Model prediction record */
export interface ModelPrediction {
  model_name: string
  model_version: string
  is_anomaly: boolean
  anomaly_score: number
  event_type: string
  confidence: number
  is_demo: boolean
}

/** System health status */
export interface SystemHealth {
  status: string
  version: string
  database: boolean
  demo_mode: boolean
  uptime_seconds: number
}

/** Demo status */
export interface DemoStatus {
  running: boolean
  paused: boolean
  source: string
  sample_rate: number
}

/** Analytics summary */
export interface AnalyticsSummary {
  active_stations: number
  events_today: number
  anomalies_detected: number
  data_points_processed: number
  stream_status: Record<string, unknown>
  ai_stats: Record<string, unknown>
}

/** Analysis result */
export interface AnalysisResult {
  processed_signal: number[]
  features: SignalFeatures
  fft: FFTResult | null
  spectrogram: SpectrogramResult | null
  anomaly: AnomalyResult | null
  classification: ClassificationResult | null
}

/** Data source types */
export type DataSource = 'demo' | 'dataset' | 'live_sensor'

/** Event types for injection */
export type EventType =
  | 'background'
  | 'possible_microbarom_like'
  | 'possible_explosion_like'
  | 'possible_meteor_like'
  | 'possible_volcanic_like'
  | 'random_anomaly'

/** Connection status */
export type ConnectionStatus = 'connected' | 'disconnected' | 'connecting' | 'error'

/** WebSocket message types */
export interface WSWaveformMessage {
  type: 'waveform'
  station_id: string
  timestamp: string
  sample_rate: number
  samples: number[]
  event_type: string
}

export interface WSMetricsMessage {
  type: 'metrics'
  station_id: string
  rms: number
  snr_db: number
  peak_amplitude: number
  dominant_frequency_hz: number
  signal_quality: number
}

export interface WSAIStatusMessage {
  type: 'ai_status'
  is_anomaly: boolean
  score: number
  event_type: string
  confidence: number
  model_version: string
  is_demo: boolean
}

export interface WSEventMessage {
  type: 'event'
  event_id: string
  station_id: string
  is_anomaly: boolean
  event_type: string
  confidence: number
  timestamp: string
}

export type WSMessage =
  | WSWaveformMessage
  | WSMetricsMessage
  | WSAIStatusMessage
  | WSEventMessage

/** Hardware connection and interface status */
export interface HardwareStatus {
  is_connected: boolean
  connection_state: 'disconnected' | 'connecting' | 'connected' | 'standby' | 'error'
  status_message: string
  model_name: string
  device_id: string
  interface_type: string
  target_frequency_range_hz: {
    min: number
    max: number
  }
  nominal_sample_rate: number
  latest_measured_pressure_pa: number | null
  last_read_timestamp: string | null
  buffer_size: number
  hardware_validated: boolean
  pipeline_stages: Array<{
    stage: number
    name: string
    status: string
  }>
}

/** Calibration benchmark test descriptor */
export interface CalibrationBenchmark {
  test_id: string
  name: string
  category: string
  status: 'measured' | 'pending_validation' | 'not_measured' | 'planned_test'
  target_spec: string
  calibration_method: string
  reference_device: string
  test_date: string | null
  measured_result: string
  empirical_data_available: boolean
  notes: string
}

/** Complete calibration suite response */
export interface CalibrationSuite {
  system_name: string
  target_frequency_range: {
    min_hz: number
    max_hz: number
    scientific_significance: string
  }
  overall_hardware_status: string
  disclaimer: string
  tests: CalibrationBenchmark[]
}

/** Recorded dataset catalog item */
export interface DatasetCatalogItem {
  id: string
  name: string
  category: 'explosion' | 'volcano' | 'ambient' | 'custom'
  source: string
  sample_rate_hz: number
  target_band_hz: [number, number]
  units: string
  channels: string[]
  description: string
}


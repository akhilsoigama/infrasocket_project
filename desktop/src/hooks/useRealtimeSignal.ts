import { useEffect } from 'react'
import { wsClient } from '@/services/websocket'
import { useSignalStore } from '@/stores/signalStore'
import { useEventStore } from '@/stores/eventStore'
import type { WSMessage } from '@/types'

export function useRealtimeSignal() {
  const appendSamples = useSignalStore((state) => state.appendSamples)
  const setMetrics = useSignalStore((state) => state.setMetrics)
  const setAIStatus = useSignalStore((state) => state.setAIStatus)
  const addEvent = useEventStore((state) => state.addEvent)

  useEffect(() => {
    // Connect WebSocket on mount if not already connected
    wsClient.connect()

    const unsubscribe = wsClient.subscribe((msg: WSMessage) => {
      switch (msg.type) {
        case 'waveform':
          appendSamples(msg.samples)
          break
        case 'metrics':
          setMetrics({
            station_id: msg.station_id,
            rms: msg.rms,
            snr_db: msg.snr_db,
            peak_amplitude: msg.peak_amplitude,
            dominant_frequency_hz: msg.dominant_frequency_hz,
            signal_quality: msg.signal_quality,
          })
          break
        case 'ai_status':
          setAIStatus({
            is_anomaly: msg.is_anomaly,
            score: msg.score,
            event_type: msg.event_type,
            confidence: msg.confidence,
            model_version: msg.model_version,
            is_demo: msg.is_demo,
          })
          break
        case 'event':
          addEvent({
            event_id: msg.event_id,
            station_id: msg.station_id,
            is_anomaly: msg.is_anomaly,
            event_type: msg.event_type,
            confidence: msg.confidence,
            timestamp: msg.timestamp,
            // Defaults since WS only sends basic info
            duration_seconds: 0,
            amplitude: 0,
            snr_db: 0,
            status: 'detected',
            is_demo: true,
          })
          break
      }
    })

    return () => {
      unsubscribe()
      // Note: We don't disconnect on unmount, we keep it alive for the app lifetime
    }
  }, [appendSamples, setMetrics, setAIStatus, addEvent])
}

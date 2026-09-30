import { useSystemStore } from '@/stores/systemStore'
import type { WSMessage } from '@/types'

const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:8000/ws/live'

export class WebSocketClient {
  private ws: WebSocket | null = null
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null
  private subscribers: Set<(msg: WSMessage) => void> = new Set()
  private isIntentionalDisconnect = false
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5

  constructor() {
    this.connect = this.connect.bind(this)
    this.disconnect = this.disconnect.bind(this)
    this.handleMessage = this.handleMessage.bind(this)
    this.handleClose = this.handleClose.bind(this)
  }

  connect() {
    if (this.ws?.readyState === WebSocket.OPEN) return

    this.isIntentionalDisconnect = false
    useSystemStore.getState().setWsStatus('connecting')

    try {
      this.ws = new WebSocket(WS_URL)

      this.ws.onopen = () => {
        console.log('WebSocket connected')
        this.reconnectAttempts = 0
        useSystemStore.getState().setWsStatus('connected')
        if (this.reconnectTimer) {
          clearTimeout(this.reconnectTimer)
          this.reconnectTimer = null
        }
      }

      this.ws.onmessage = this.handleMessage
      this.ws.onclose = this.handleClose
      this.ws.onerror = () => {
        // Will trigger onclose
      }
    } catch (e) {
      console.error('WebSocket connection error', e)
      this.handleClose()
    }
  }

  disconnect() {
    this.isIntentionalDisconnect = true
    if (this.ws) {
      this.ws.close()
      this.ws = null
    }
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
      this.reconnectTimer = null
    }
    useSystemStore.getState().setWsStatus('disconnected')
  }

  subscribe(callback: (msg: WSMessage) => void) {
    this.subscribers.add(callback)
    return () => {
      this.subscribers.delete(callback)
    }
  }

  private handleMessage(event: MessageEvent) {
    try {
      const data = JSON.parse(event.data) as WSMessage
      this.subscribers.forEach((cb) => cb(data))
    } catch (e) {
      console.error('Failed to parse WS message', e)
    }
  }

  private handleClose() {
    this.ws = null
    useSystemStore.getState().setWsStatus(this.isIntentionalDisconnect ? 'disconnected' : 'error')

    if (!this.isIntentionalDisconnect && this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++
      const timeout = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 10000)
      console.log(`WebSocket reconnecting in ${timeout}ms...`)
      
      if (this.reconnectTimer) clearTimeout(this.reconnectTimer)
      this.reconnectTimer = setTimeout(this.connect, timeout)
    }
  }

  send(data: unknown) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data))
    }
  }
}

export const wsClient = new WebSocketClient()

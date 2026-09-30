import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)

// Use contextBridge safely via electronAPI
if (window.electronAPI) {
  console.log('Running in Electron context:', window.electronAPI.platform)
} else {
  console.log('Running in standard web context')
}

declare global {
  interface Window {
    electronAPI?: {
      platform: string
      versions: {
        node: string
        chrome: string
        electron: string
      }
    }
  }
}

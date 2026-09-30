import { contextBridge } from 'electron'

/**
 * Electron preload script.
 *
 * Runs in a sandboxed context with access to a subset of
 * Node.js and Electron APIs. Uses contextBridge to safely
 * expose specific APIs to the renderer process.
 *
 * Security: contextIsolation is enabled, nodeIntegration
 * is disabled. Only explicitly bridged APIs are available
 * to the React application.
 */
contextBridge.exposeInMainWorld('electronAPI', {
  platform: process.platform,
  versions: {
    node: process.versions.node,
    chrome: process.versions.chrome,
    electron: process.versions.electron,
  },
})

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createHashRouter, RouterProvider } from 'react-router-dom'

import AppLayout from './layouts/AppLayout'
import Overview from './pages/Overview'
import LiveMonitoring from './pages/LiveMonitoring'
import Stations from './pages/Stations'
import Events from './pages/Events'
import SignalAnalysis from './pages/SignalAnalysis'
import AIInsights from './pages/AIInsights'
import HistoricalData from './pages/HistoricalData'
import Settings from './pages/Settings'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 5000,
      retry: 1,
    },
  },
})

// Use HashRouter for Electron compatibility (file:// protocol)
const router = createHashRouter([
  {
    path: '/',
    element: <AppLayout />,
    children: [
      { index: true, element: <Overview /> },
      { path: 'live', element: <LiveMonitoring /> },
      // Placeholders for other pages
      { path: 'stations', element: <Stations /> },
      { path: 'events', element: <Events /> },
      { path: 'analysis', element: <SignalAnalysis /> },
      { path: 'ai', element: <AIInsights /> },
      { path: 'history', element: <HistoricalData /> },
      { path: 'settings', element: <Settings /> },
    ],
  },
])

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  )
}

export default App

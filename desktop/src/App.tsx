import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createHashRouter, RouterProvider } from 'react-router-dom'

import AppLayout from './layouts/AppLayout'
import Overview from './pages/Overview'
import LiveMonitoring from './pages/LiveMonitoring'

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
      { path: 'stations', element: <div className="p-8">Stations Page (Placeholder)</div> },
      { path: 'events', element: <div className="p-8">Events Page (Placeholder)</div> },
      { path: 'analysis', element: <div className="p-8">Signal Analysis (Placeholder)</div> },
      { path: 'ai', element: <div className="p-8">AI Insights (Placeholder)</div> },
      { path: 'history', element: <div className="p-8">Historical Data (Placeholder)</div> },
      { path: 'settings', element: <div className="p-8">Settings (Placeholder)</div> },
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

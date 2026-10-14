import { createBrowserRouter, Navigate } from 'react-router-dom'

import AppLayout from '@/layouts/AppLayout'
import {
  Overview,
  LiveMonitoring,
  SignalAnalysis,
  Stations,
  Events,
  AIInsights,
  Calibration,
  HistoricalData,
  Settings,
  NotFound,
} from '@/pages'
import { ROUTES } from './routeConfig'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />,
    children: [
      {
        index: true,
        element: <Overview />,
      },
      {
        path: ROUTES.LIVE_MONITORING.replace('/', ''),
        element: <LiveMonitoring />,
      },
      {
        path: ROUTES.SIGNAL_ANALYSIS.replace('/', ''),
        element: <SignalAnalysis />,
      },
      {
        // Alias for signal analysis
        path: 'signal-analysis',
        element: <Navigate to={ROUTES.SIGNAL_ANALYSIS} replace />,
      },
      {
        path: ROUTES.STATIONS.replace('/', ''),
        element: <Stations />,
      },
      {
        path: ROUTES.EVENTS.replace('/', ''),
        element: <Events />,
      },
      {
        path: ROUTES.AI_INSIGHTS.replace('/', ''),
        element: <AIInsights />,
      },
      {
        // Backward-compatible redirect for /ai
        path: 'ai',
        element: <Navigate to={ROUTES.AI_INSIGHTS} replace />,
      },
      {
        path: ROUTES.CALIBRATION.replace('/', ''),
        element: <Calibration />,
      },
      {
        path: ROUTES.HISTORICAL_DATA.replace('/', ''),
        element: <HistoricalData />,
      },
      {
        // Alias for historical data
        path: 'historical-data',
        element: <Navigate to={ROUTES.HISTORICAL_DATA} replace />,
      },
      {
        path: ROUTES.SETTINGS.replace('/', ''),
        element: <Settings />,
      },
      {
        path: '*',
        element: <NotFound />,
      },
    ],
  },
])

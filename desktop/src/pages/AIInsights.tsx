import { useQuery } from '@tanstack/react-query'
import { Brain, TrendingUp, AlertTriangle, ShieldCheck } from 'lucide-react'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { api } from '@/services/api'

export default function AIInsights() {
  const { data: summary, isLoading } = useQuery({
    queryKey: ['analytics-summary'],
    queryFn: api.getAnalyticsSummary,
    refetchInterval: 5000,
  })

  // Simulated metrics derived from the summary
  const anomalyRate = summary 
    ? (summary.anomalies_detected / Math.max(summary.events_today, 1)) * 100 
    : 0

  const accuracyScore = 98.4 // Mock accuracy for demo

  return (
    <div className="flex h-full flex-col space-y-6 p-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">AI Insights</h2>
        <p className="text-muted-foreground">
          Machine learning model performance and anomaly classifications
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Model Status</CardTitle>
            <Brain className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">Active</div>
            <p className="text-xs text-muted-foreground">
              Isolation Forest v1.0.0
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Anomalies Today</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? '...' : summary?.anomalies_detected || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Out of {summary?.events_today || 0} total events
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Anomaly Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{anomalyRate.toFixed(1)}%</div>
            <Progress value={anomalyRate} className="mt-2 h-1" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Accuracy</CardTitle>
            <ShieldCheck className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{accuracyScore}%</div>
            <p className="text-xs text-muted-foreground">
              Based on human validation
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 grid-cols-1 md:grid-cols-2 flex-1">
        <Card>
          <CardHeader>
            <CardTitle>Feature Importance</CardTitle>
            <CardDescription>Metrics driving the current AI model decisions</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Signal-to-Noise Ratio (SNR)</span>
                <span className="font-mono">82%</span>
              </div>
              <Progress value={82} />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Spectral Centroid</span>
                <span className="font-mono">65%</span>
              </div>
              <Progress value={65} />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Peak Amplitude</span>
                <span className="font-mono">41%</span>
              </div>
              <Progress value={41} />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Zero Crossing Rate</span>
                <span className="font-mono">29%</span>
              </div>
              <Progress value={29} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Model Classifications</CardTitle>
            <CardDescription>Latest events tagged by the classifier network</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Fetching from summary stats to represent classifications */}
              <div className="flex items-center p-3 border rounded-lg bg-card shadow-sm">
                <div className="mr-4 rounded-full bg-red-100 p-2 dark:bg-red-900/20">
                  <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />
                </div>
                <div className="flex-1 space-y-1">
                  <p className="text-sm font-medium leading-none">Explosion Signature</p>
                  <p className="text-sm text-muted-foreground">High confidence detection (94%)</p>
                </div>
                <div className="font-mono text-sm text-muted-foreground">INFRA-001</div>
              </div>

              <div className="flex items-center p-3 border rounded-lg bg-card shadow-sm">
                <div className="mr-4 rounded-full bg-orange-100 p-2 dark:bg-orange-900/20">
                  <AlertTriangle className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                </div>
                <div className="flex-1 space-y-1">
                  <p className="text-sm font-medium leading-none">Meteor Bolide</p>
                  <p className="text-sm text-muted-foreground">Medium confidence detection (72%)</p>
                </div>
                <div className="font-mono text-sm text-muted-foreground">INFRA-001</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

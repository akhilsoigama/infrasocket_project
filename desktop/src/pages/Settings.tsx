import { useQuery } from '@tanstack/react-query'
import { CheckCircle2, Server, Settings as SettingsIcon, XCircle } from 'lucide-react'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { api } from '@/services/api'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'

export default function Settings() {
  // Fetch system health
  const { data: health, isLoading } = useQuery({
    queryKey: ['system-health'],
    queryFn: api.getHealth,
    refetchInterval: 10000,
  })

  return (
    <div className="flex h-full flex-col space-y-6 p-8 max-w-4xl mx-auto">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">System Settings</h2>
        <p className="text-muted-foreground">
          Application configuration and diagnostic information
        </p>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Server className="h-5 w-5" /> Backend Connection Status
            </CardTitle>
            <CardDescription>Real-time API health and component tracking</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {isLoading ? (
              <p className="text-sm text-muted-foreground">Pinging backend...</p>
            ) : health ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">API Server</span>
                  <Badge variant={health.status === 'healthy' ? 'default' : 'destructive'} className="gap-1">
                    {health.status === 'healthy' ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                    {health.status.toUpperCase()}
                  </Badge>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">PostgreSQL Database</span>
                  <Badge variant={health.database ? 'default' : 'secondary'} className="gap-1">
                    {health.database ? <CheckCircle2 className="h-3 w-3" /> : <AlertTriangle className="h-3 w-3" />}
                    {health.database ? 'CONNECTED' : 'OFFLINE (Memory Mode)'}
                  </Badge>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Demo Mode Allowed</span>
                  <span className="text-sm text-muted-foreground">{health.demo_mode ? 'Yes' : 'No'}</span>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">API Version</span>
                  <span className="text-sm font-mono">{health.version}</span>
                </div>
              </div>
            ) : (
              <div className="flex items-center text-destructive text-sm gap-2">
                <XCircle className="h-4 w-4" /> Could not reach backend server
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <SettingsIcon className="h-5 w-5" /> Application Preferences
            </CardTitle>
            <CardDescription>Local client settings</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground py-8 text-center border-2 border-dashed rounded-md">
              Settings interface is currently managed via environment variables.
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function AlertTriangle(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
      <path d="M12 9v4" />
      <path d="M12 17h.01" />
    </svg>
  )
}

import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Radio, ArrowLeft, ShieldAlert } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { ROUTES } from '@/routes/routeConfig'

export default function NotFound() {
  const location = useLocation()

  return (
    <div className="flex h-full w-full flex-col items-center justify-center p-8 bg-background">
      <Card className="max-w-md w-full border-border/60 bg-card/80 backdrop-blur-md shadow-2xl text-center">
        <CardContent className="p-8 space-y-6">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10 text-destructive border border-destructive/20 animate-pulse">
            <Radio className="h-8 w-8" />
          </div>

          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 rounded-full border border-destructive/30 bg-destructive/10 px-3 py-1 text-xs font-mono text-destructive">
              <ShieldAlert className="h-3.5 w-3.5" /> STATUS 404: TELEMETRY ROUTE NOT FOUND
            </div>
            <h1 className="text-2xl font-bold font-mono tracking-tight text-foreground">
              SIGNAL CARRIER LOST
            </h1>
            <p className="text-xs text-muted-foreground font-mono">
              The requested monitoring endpoint <span className="text-primary font-bold">{location.pathname}</span> is not registered in the array routing table.
            </p>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center">
            <Button asChild variant="default" className="gap-2 font-mono text-xs">
              <Link to={ROUTES.OVERVIEW}>
                <ArrowLeft className="h-4 w-4" /> Return to Overview
              </Link>
            </Button>
            <Button asChild variant="outline" className="gap-2 font-mono text-xs">
              <Link to={ROUTES.LIVE_MONITORING}>
                Live Waveforms
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

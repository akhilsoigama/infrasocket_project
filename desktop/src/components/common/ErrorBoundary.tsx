import React, { Component, ErrorInfo, ReactNode } from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error in UI component:', error, errorInfo)
  }

  public handleReload = () => {
    this.setState({ hasError: false, error: null })
    window.location.reload()
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex h-full w-full items-center justify-center p-8 bg-background">
          <Card className="max-w-md border-destructive/40 bg-card/90 shadow-2xl backdrop-blur-md">
            <CardHeader className="flex flex-row items-center gap-3 space-y-0 text-destructive">
              <AlertTriangle className="h-6 w-6" />
              <CardTitle className="text-lg">Telemetry Processing Exception</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-xs text-muted-foreground font-mono">
                A rendering interrupt occurred in the monitoring display engine.
              </p>
              {this.state.error && (
                <div className="max-h-32 overflow-auto rounded border border-destructive/20 bg-destructive/10 p-2.5 font-mono text-xs text-destructive">
                  {this.state.error.message}
                </div>
              )}
              <Button onClick={this.handleReload} variant="outline" className="w-full gap-2">
                <RefreshCw className="h-4 w-4" /> Reinitialize View
              </Button>
            </CardContent>
          </Card>
        </div>
      )
    }

    return this.props.children
  }
}

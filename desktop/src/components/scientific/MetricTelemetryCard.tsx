import React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import type { LucideIcon } from 'lucide-react'

interface MetricTelemetryCardProps {
  label: string
  value: string | number
  unit?: string
  subtext?: string
  icon?: LucideIcon
  tone?: 'default' | 'cyan' | 'emerald' | 'amber' | 'rose'
  className?: string
}

export function MetricTelemetryCard({
  label,
  value,
  unit,
  subtext,
  icon: Icon,
  tone = 'default',
  className,
}: MetricTelemetryCardProps) {
  const toneClasses = {
    default: 'text-foreground border-border/40 hover:border-primary/40',
    cyan: 'text-cyan-400 border-cyan-500/20 bg-cyan-950/10 hover:border-cyan-400/50',
    emerald: 'text-emerald-400 border-emerald-500/20 bg-emerald-950/10 hover:border-emerald-400/50',
    amber: 'text-amber-400 border-amber-500/20 bg-amber-950/10 hover:border-amber-400/50',
    rose: 'text-rose-400 border-rose-500/20 bg-rose-950/10 hover:border-rose-400/50',
  }

  const iconColor = {
    default: 'text-muted-foreground',
    cyan: 'text-cyan-400',
    emerald: 'text-emerald-400',
    amber: 'text-amber-400',
    rose: 'text-rose-400',
  }

  return (
    <Card className={cn('relative overflow-hidden transition-all duration-200 backdrop-blur-sm min-w-0', toneClasses[tone], className)}>
      <CardContent className="p-3 sm:p-4 min-w-0">
        <div className="flex items-center justify-between gap-1 pb-1.5 min-w-0">
          <span className="text-3xs sm:text-2xs font-semibold uppercase tracking-wider text-muted-foreground font-mono truncate">
            {label}
          </span>
          {Icon && <Icon className={cn('h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0', iconColor[tone])} />}
        </div>
        <div className="flex items-baseline gap-1.5 min-w-0 flex-wrap">
          <span className="text-lg sm:text-xl md:text-2xl font-bold font-mono tracking-tight truncate">
            {value}
          </span>
          {unit && (
            <span className="text-3xs sm:text-xs font-mono text-muted-foreground uppercase shrink-0">
              {unit}
            </span>
          )}
        </div>
        {subtext && (
          <p className="mt-1 text-3xs sm:text-2xs text-muted-foreground font-mono truncate" title={subtext}>
            {subtext}
          </p>
        )}
      </CardContent>
    </Card>
  )
}

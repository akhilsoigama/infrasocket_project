import React from 'react'
import { Badge } from '@/components/ui/badge'

interface PageHeaderProps {
  title: string
  subtitle: string
  badgeText?: string
  badgeVariant?: 'default' | 'secondary' | 'destructive' | 'outline' | 'success'
  children?: React.ReactNode
  sticky?: boolean
}

export function PageHeader({
  title,
  subtitle,
  badgeText,
  badgeVariant = 'secondary',
  children,
  sticky = false,
}: PageHeaderProps) {
  return (
    <div
      className={`flex flex-col gap-2.5 border-b border-border/50 pb-3.5 min-w-0 ${
        sticky
          ? 'sticky top-0 z-20 bg-background/95 backdrop-blur-md pt-2 pb-3.5 -mt-2'
          : ''
      }`}
    >
      {/* Primary Row: Title + Badge on left, Action Controls on right */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 min-w-0">
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-wrap">
          <h1 className="text-lg sm:text-xl xl:text-2xl font-bold tracking-tight text-foreground font-sans">
            {title}
          </h1>
          {badgeText && (
            <Badge
              variant={badgeVariant}
              className="text-3xs font-mono uppercase tracking-wider shrink-0 px-2.5 py-0.5 border whitespace-nowrap"
            >
              {badgeText}
            </Badge>
          )}
        </div>

        {children && (
          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            {children}
          </div>
        )}
      </div>

      {/* Secondary Row: Scientific Specification Subtitle spanning full width */}
      {subtitle && (
        <p className="text-xs text-muted-foreground font-mono tracking-wide leading-relaxed">
          {subtitle}
        </p>
      )}
    </div>
  )
}

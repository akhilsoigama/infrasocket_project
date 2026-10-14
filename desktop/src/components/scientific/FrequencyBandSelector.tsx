import React from 'react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

export interface BandPreset {
  id: string
  label: string
  lowHz: number
  highHz: number
  category: string
  description: string
}

export const INFRASOUND_BANDS: BandPreset[] = [
  {
    id: 'full',
    label: 'Broadband',
    lowHz: 0.01,
    highHz: 20.0,
    category: 'Full Array',
    description: 'Nyquist-bounded broadband infrasound channel (0.01 - 20 Hz)',
  },
  {
    id: 'microbarom',
    label: 'Microbaroms',
    lowHz: 0.1,
    highHz: 0.5,
    category: 'Oceanic Wave',
    description: 'Marine storm wave interference standing acoustic waves (0.1 - 0.5 Hz)',
  },
  {
    id: 'bolide',
    label: 'Shockwaves / Bolides',
    lowHz: 0.5,
    highHz: 2.5,
    category: 'Impulsive',
    description: 'Explosive blast wavefronts, supersonic bolides, and quarry blasts (0.5 - 2.5 Hz)',
  },
  {
    id: 'volcanic',
    label: 'Volcanic Tremor',
    lowHz: 1.0,
    highHz: 4.5,
    category: 'Geophysical',
    description: 'Magmatic resonance and volcanic gas venting harmonics (1.0 - 4.5 Hz)',
  },
]

interface FrequencyBandSelectorProps {
  selectedBandId?: string
  onSelectBand: (band: BandPreset) => void
  className?: string
}

export function FrequencyBandSelector({
  selectedBandId,
  onSelectBand,
  className,
}: FrequencyBandSelectorProps) {
  return (
    <div className={cn('flex flex-wrap gap-2', className)}>
      {INFRASOUND_BANDS.map((band) => {
        const isSelected = selectedBandId === band.id
        return (
          <button
            key={band.id}
            type="button"
            onClick={() => onSelectBand(band)}
            className={cn(
              'group flex items-center gap-2 rounded-md border px-3 py-1.5 text-xs font-mono transition-all duration-150',
              isSelected
                ? 'border-primary bg-primary/15 text-primary shadow-[0_0_10px_rgba(56,189,248,0.25)]'
                : 'border-border/60 bg-card/60 text-muted-foreground hover:border-border hover:bg-card hover:text-foreground'
            )}
            title={band.description}
          >
            <span className="font-semibold">{band.label}</span>
            <Badge
              variant="outline"
              className={cn(
                'px-1.5 py-0 text-3xs font-mono',
                isSelected ? 'border-primary/50 text-primary' : 'border-border/60 text-muted-foreground'
              )}
            >
              {band.lowHz}-{band.highHz} Hz
            </Badge>
          </button>
        )
      })}
    </div>
  )
}

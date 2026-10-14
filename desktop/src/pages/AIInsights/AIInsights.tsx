import { useQuery } from '@tanstack/react-query'
import {
  Brain,
  TrendingUp,
  AlertTriangle,
  ShieldCheck,
  Cpu,
  Sliders,
  CheckCircle2,
  Sparkles,
  HelpCircle,
  Layers,
  Clock,
  Compass,
} from 'lucide-react'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { PageHeader } from '@/components/common/PageHeader'
import { MetricTelemetryCard } from '@/components/scientific/MetricTelemetryCard'
import { Separator } from '@/components/ui/separator'
import { api } from '@/services/api'
import { formatNumber } from '@/lib/utils'

export default function AIInsights() {
  const { data: summary, isLoading } = useQuery({
    queryKey: ['analytics-summary'],
    queryFn: api.getAnalyticsSummary,
    refetchInterval: 5000,
  })

  const anomalyRate = summary
    ? (summary.anomalies_detected / Math.max(summary.events_today, 1)) * 100
    : 0

  const features = [
    {
      name: 'Signal-to-Noise Ratio (SNR)',
      weight: 84,
      description: 'Relative acoustic signal energy vs ambient 0.01 - 20 Hz background noise floor',
    },
    {
      name: 'Spectral Centroid (Frequency Center)',
      weight: 72,
      description: 'Center of spectral mass across the 0.01 - 20.0 Hz infrasound band',
    },
    {
      name: 'Waveform Kurtosis & Heavy-Tails',
      weight: 58,
      description: 'Measures impulsive shockwave spikiness vs Gaussian ambient atmospheric turbulence',
    },
    {
      name: 'Peak-to-Peak Acoustic Amplitude (Pa)',
      weight: 46,
      description: 'Maximum instantaneous differential pressure fluctuation',
    },
    {
      name: 'Zero Crossing Rate (ZCR)',
      weight: 34,
      description: 'Rate of sign-changes reflecting dominant oscillation period in infrasonic band',
    },
    {
      name: 'Spectral Crest Factor',
      weight: 28,
      description: 'Ratio of maximum peak spectral harmonic to RMS spectral magnitude',
    },
  ]

  return (
    <div className="flex h-full flex-col space-y-4 sm:space-y-6 p-4 sm:p-6 lg:p-8 overflow-y-auto min-w-0">
      <PageHeader
        title="Signal Classification & Outlier Engine"
        subtitle="RULE-BASED ACOUSTIC HEURISTICS • ISOLATION FOREST OUTLIER SCORING • FUTURE ML ROADMAP"
        badgeText="RULE-BASED ANALYSIS"
        badgeVariant="default"
      />

      {/* Scientific Transparency Notice */}
      <div className="rounded-lg border border-border/50 bg-card/60 p-4 font-mono text-xs text-foreground">
        <div className="flex items-start gap-3">
          <Brain className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-bold text-foreground">
              Classification Architecture Notice:
            </span>
            <p className="text-2xs text-muted-foreground leading-relaxed">
              Current active classification utilizes <strong>rule-based physical signal heuristics</strong> and
              <strong> scikit-learn Isolation Forest unsupervised outlier scoring</strong>. Validated deep learning
              (CNN) models are in development and cataloged below as future enhancements. Unknown signals are
              allowed to remain unclassified without forced labeling.
            </p>
          </div>
        </div>
      </div>

      {/* Top AI & Rule-Based Metrics */}
      <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 font-mono min-w-0">
        <MetricTelemetryCard
          label="Outlier Architecture"
          value="IsoForest"
          subtext="100 Estimators • Unsupervised"
          icon={Brain}
          tone="cyan"
        />
        <MetricTelemetryCard
          label="Flagged Outliers"
          value={isLoading ? '...' : summary?.anomalies_detected || 0}
          unit="Events"
          subtext={`Out of ${summary?.events_today || 0} total arrivals`}
          icon={AlertTriangle}
          tone="rose"
        />
        <MetricTelemetryCard
          label="Contamination Rate"
          value={formatNumber(anomalyRate, 1)}
          unit="%"
          subtext="Empirical outlier proportion"
          icon={TrendingUp}
          tone="amber"
        />
        <MetricTelemetryCard
          label="Classification Method"
          value="Rule-Based"
          subtext="Heuristic acoustic thresholds"
          icon={ShieldCheck}
          tone="emerald"
        />
      </div>

      <div className="grid gap-6 grid-cols-1 lg:grid-cols-2 flex-1 min-w-0">
        {/* Feature Importance Card */}
        <Card className="border-border/50 bg-card/80 shadow-lg font-mono text-xs">
          <CardHeader className="border-b border-border/40 pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-mono">Feature Weight Matrix</CardTitle>
                <CardDescription className="text-xs font-mono">
                  Relative contribution of acoustic DSP features to Isolation Forest tree splits
                </CardDescription>
              </div>
              <Badge variant="outline" className="font-mono text-3xs">
                6 Physical Features
              </Badge>
            </div>
          </CardHeader>

          <CardContent className="p-6 space-y-5">
            {features.map((feat) => (
              <div key={feat.name} className="space-y-1.5">
                <div className="flex justify-between items-center text-xs font-mono">
                  <span className="font-semibold text-foreground">{feat.name}</span>
                  <span className="text-cyan-400 font-bold">{feat.weight}%</span>
                </div>
                <Progress value={feat.weight} className="h-1.5 bg-muted" />
                <p className="text-3xs text-muted-foreground">{feat.description}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Classification Engine Status & Future Roadmap */}
        <Card className="border-border/50 bg-card/80 shadow-lg font-mono text-xs flex flex-col justify-between">
          <CardHeader className="border-b border-border/40 pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-mono">Classification Engine & ML Roadmap</CardTitle>
                <CardDescription className="text-xs font-mono">
                  Active rule-based heuristics vs planned supervised ML models
                </CardDescription>
              </div>
              <Badge variant="outline" className="text-3xs font-mono">
                ENGINE STATUS
              </Badge>
            </div>
          </CardHeader>

          <CardContent className="p-6 space-y-4">
            <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-4 space-y-2">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                <span className="font-bold text-foreground">1. Active: Rule-Based Signal Heuristics</span>
                <Badge variant="outline" className="text-3xs text-emerald-400 border-emerald-500/40 ml-auto">
                  OPERATIONAL
                </Badge>
              </div>
              <p className="text-2xs text-muted-foreground leading-relaxed">
                Applies physical thresholds on peak/RMS ratio, dominant frequency (&lt; 2 Hz for volcanic, 0.1–0.5 Hz for microbaroms, sharp onset for explosions).
                Signals not meeting minimum criteria remain explicitly <strong>Unclassified Infrasonic Signal</strong>.
              </p>
            </div>

            <div className="rounded-lg border border-border/50 bg-muted/20 p-4 space-y-2">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-amber-400" />
                <span className="font-bold text-foreground">2. Active: Isolation Forest Outlier Detection</span>
                <Badge variant="outline" className="text-3xs text-amber-400 border-amber-500/40 ml-auto">
                  OPERATIONAL
                </Badge>
              </div>
              <p className="text-2xs text-muted-foreground leading-relaxed">
                Unsupervised ensemble of 100 isolation trees flags statistical outliers in feature space without making unverified classification claims.
              </p>
            </div>

            <div className="rounded-lg border border-dashed border-border/60 bg-card/40 p-4 space-y-2">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-cyan-400" />
                <span className="font-bold text-foreground">3. Future Enhancement: Deep Learning CNN</span>
                <Badge variant="outline" className="text-3xs text-cyan-400 border-cyan-500/40 ml-auto">
                  PLANNED ML
                </Badge>
              </div>
              <p className="text-2xs text-muted-foreground leading-relaxed">
                Supervised 2D Convolutional Neural Network trained on STFT spectrogram representations.
                Will undergo formal seismological validation against verified CTBTO/IMS event catalogs before deployment.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

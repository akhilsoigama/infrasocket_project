"""Demo event classifier.

Provides heuristic-based event classification for demo mode.
This is NOT a trained ML classifier — it uses simple feature
thresholds to suggest possible event categories.

For a real deployment, this would be replaced by a trained
supervised classifier (e.g., PyTorch CNN).
"""

import logging
from typing import Any

from .base import BaseClassifier

logger = logging.getLogger(__name__)


class EventClassifier(BaseClassifier):
    """Heuristic demo event classifier.

    Uses simple feature thresholds to suggest possible event
    categories. All classifications are labeled as demo
    predictions and should not be treated as scientifically
    validated results.
    """

    VERSION = "demo-heuristic-v1"

    # Feature thresholds (demo heuristics only)
    THRESHOLDS = {
        "high_energy": 50.0,
        "low_frequency": 2.0,
        "high_peak": 2.0,
        "sustained_duration": 3.0,
    }

    def classify(self, features: list[float]) -> dict[str, Any]:
        """Classify a signal window using demo heuristics.

        Args:
            features: Feature vector from extract_features + features_to_vector.
                Expected order: [peak_amplitude, rms, energy, snr_db,
                dominant_frequency_hz, spectral_centroid_hz,
                zero_crossing_rate, mean, std, skewness, kurtosis]

        Returns:
            Classification result.
        """
        if len(features) < 7:
            return {
                "event_type": "unknown",
                "confidence": 0.0,
                "is_demo_classification": True,
                "classifier_version": self.VERSION,
            }

        peak_amp = features[0]
        rms = features[1]
        energy = features[2]
        snr = features[3]
        dom_freq = features[4]
        spectral_centroid = features[5]
        zcr = features[6]

        # Demo classification heuristics
        scores: dict[str, float] = {}

        # Explosion-like: high energy, sharp onset (high peak/rms ratio)
        peak_rms_ratio = peak_amp / max(rms, 1e-10)
        if energy > self.THRESHOLDS["high_energy"] and peak_rms_ratio > 3.0:
            scores["possible_explosion_like"] = min(
                0.4 + (peak_rms_ratio - 3.0) * 0.1 + (energy - 50) * 0.002,
                0.95,
            )

        # Meteor-like: frequency glide, moderate duration
        if dom_freq > 1.0 and spectral_centroid > 3.0:
            scores["possible_meteor_like"] = min(
                0.3 + (spectral_centroid - 3.0) * 0.05 + snr * 0.01,
                0.90,
            )

        # Volcanic-like: low frequency, sustained energy
        if dom_freq < self.THRESHOLDS["low_frequency"] and energy > 20.0:
            scores["possible_volcanic_like"] = min(
                0.35 + (2.0 - dom_freq) * 0.1 + energy * 0.003,
                0.85,
            )

        # Microbarom-like: very low frequency, moderate amplitude
        if dom_freq < 0.5 and rms < 0.5:
            scores["possible_microbarom_like"] = min(
                0.5 + (0.5 - dom_freq) * 0.3,
                0.80,
            )

        if not scores:
            return {
                "event_type": "background",
                "confidence": 0.7,
                "is_demo_classification": True,
                "classifier_version": self.VERSION,
            }

        # Pick highest scoring category
        best_type = max(scores, key=scores.get)  # type: ignore
        best_confidence = scores[best_type]

        return {
            "event_type": best_type,
            "confidence": round(best_confidence, 2),
            "all_scores": {k: round(v, 3) for k, v in scores.items()},
            "is_demo_classification": True,
            "classifier_version": self.VERSION,
        }


class ClassifierRegistry:
    """Registry for event classifiers (extensible)."""

    def __init__(self) -> None:
        self._classifiers: dict[str, BaseClassifier] = {}
        # Register the default demo classifier
        self.register("demo", EventClassifier())

    def register(self, name: str, classifier: BaseClassifier) -> None:
        """Register a classifier."""
        self._classifiers[name] = classifier

    def get(self, name: str = "demo") -> BaseClassifier:
        """Get a classifier by name."""
        if name not in self._classifiers:
            raise KeyError(f"Unknown classifier: {name}")
        return self._classifiers[name]

    @property
    def available(self) -> list[str]:
        """List available classifier names."""
        return list(self._classifiers.keys())

"""Inference engine combining anomaly detection and classification.

Provides a unified interface for running the complete AI pipeline
on signal windows.
"""

import logging
from typing import Optional

import numpy as np
from numpy.typing import NDArray

from .anomaly import AnomalyDetector
from .classifier import EventClassifier
from .features import prepare_features

logger = logging.getLogger(__name__)


class InferenceEngine:
    """Unified inference engine for signal analysis.

    Combines anomaly detection and event classification
    into a single pipeline.
    """

    def __init__(self) -> None:
        self.anomaly_detector = AnomalyDetector()
        self.classifier = EventClassifier()
        self._windows_analyzed: int = 0
        self._anomaly_count: int = 0
        self._normal_count: int = 0
        self._initialized: bool = False

    def initialize(self) -> None:
        """Initialize the inference engine by training on normal data."""
        if self._initialized:
            return
        logger.info("Initializing inference engine...")
        self.anomaly_detector.fit_on_normal_data(n_samples=200)
        self._initialized = True
        logger.info("Inference engine ready")

    def analyze_window(
        self,
        signal: NDArray[np.float64],
        sample_rate: float,
    ) -> dict:
        """Analyze a signal window for anomalies and classify it.

        Args:
            signal: Signal window array.
            sample_rate: Sampling rate (Hz).

        Returns:
            Dictionary with anomaly detection and classification results.
        """
        if not self._initialized:
            self.initialize()

        feature_dict, feature_vec = prepare_features(signal, sample_rate)

        # Anomaly detection
        anomaly_result = self.anomaly_detector.predict(feature_vec)

        # Classification (only if anomalous or for all windows)
        classification = self.classifier.classify(feature_vec)

        # Update stats
        self._windows_analyzed += 1
        if anomaly_result["is_anomaly"]:
            self._anomaly_count += 1
        else:
            self._normal_count += 1

        return {
            "anomaly": anomaly_result,
            "classification": classification,
            "features": feature_dict,
            "windows_analyzed": self._windows_analyzed,
        }

    @property
    def stats(self) -> dict:
        """Get inference statistics."""
        return {
            "initialized": self._initialized,
            "windows_analyzed": self._windows_analyzed,
            "anomaly_count": self._anomaly_count,
            "normal_count": self._normal_count,
            "anomaly_rate": (
                self._anomaly_count / max(self._windows_analyzed, 1)
            ),
            "model_stats": self.anomaly_detector.stats,
        }

    @property
    def is_ready(self) -> bool:
        """Check if the engine is initialized and ready."""
        return self._initialized

"""Anomaly detection using scikit-learn Isolation Forest.

This module implements unsupervised anomaly detection on
signal feature vectors. The Isolation Forest model is trained
on normal signal windows and detects statistical outliers.

IMPORTANT: This is a demo anomaly detector. The model is trained
on synthetic data and its predictions should be treated as
demonstrations, not scientifically validated results.
"""

import logging
from typing import Any, Optional

import numpy as np
from sklearn.ensemble import IsolationForest

from .base import BaseDetector

logger = logging.getLogger(__name__)


class AnomalyDetector(BaseDetector):
    """Isolation Forest based anomaly detector.

    Trained on feature vectors extracted from signal windows.
    Detects windows that are statistically unusual compared
    to the training distribution.

    Note: Demo model — not scientifically validated.
    """

    MODEL_VERSION = "demo-v1"

    def __init__(
        self,
        contamination: float = 0.1,
        n_estimators: int = 100,
        random_state: int = 42,
    ) -> None:
        """Initialize the anomaly detector.

        Args:
            contamination: Expected proportion of anomalies.
            n_estimators: Number of trees in the forest.
            random_state: Random seed for reproducibility.
        """
        self.contamination = contamination
        self.n_estimators = n_estimators
        self.random_state = random_state
        self._model: Optional[IsolationForest] = None
        self._is_fitted: bool = False
        self._n_features: int = 0
        self._stats = {
            "total_predictions": 0,
            "anomaly_count": 0,
            "normal_count": 0,
        }

    def fit(self, features: list[list[float]]) -> None:
        """Train the Isolation Forest on feature vectors.

        Args:
            features: List of feature vectors from normal signal windows.

        Raises:
            ValueError: If features are empty or inconsistent.
        """
        if not features:
            raise ValueError("Cannot fit on empty feature set")

        X = np.array(features, dtype=np.float64)
        if X.ndim != 2:
            raise ValueError(f"Features must be 2D, got {X.ndim}D")

        # Replace NaN/Inf with 0
        X = np.nan_to_num(X, nan=0.0, posinf=0.0, neginf=0.0)

        self._n_features = X.shape[1]
        self._model = IsolationForest(
            contamination=self.contamination,
            n_estimators=self.n_estimators,
            random_state=self.random_state,
        )
        self._model.fit(X)
        self._is_fitted = True

        logger.info(
            "AnomalyDetector fitted on %d samples with %d features",
            X.shape[0],
            X.shape[1],
        )

    def predict(self, features: list[float]) -> dict[str, Any]:
        """Predict whether a feature vector is anomalous.

        Args:
            features: Single feature vector.

        Returns:
            Dictionary with:
                - is_anomaly: Boolean anomaly flag.
                - score: Anomaly score (0.0 to 1.0, higher = more anomalous).
                - model_version: Version identifier.
                - is_demo: True (always, for this demo model).
        """
        if not self._is_fitted or self._model is None:
            return {
                "is_anomaly": False,
                "score": 0.0,
                "model_version": self.MODEL_VERSION,
                "is_demo": True,
                "error": "Model not fitted",
            }

        X = np.array([features], dtype=np.float64)
        X = np.nan_to_num(X, nan=0.0, posinf=0.0, neginf=0.0)

        # Pad or truncate to expected feature count
        if X.shape[1] < self._n_features:
            X = np.pad(X, ((0, 0), (0, self._n_features - X.shape[1])))
        elif X.shape[1] > self._n_features:
            X = X[:, : self._n_features]

        prediction = self._model.predict(X)[0]
        raw_score = self._model.decision_function(X)[0]

        # Convert to 0-1 scale (lower decision_function = more anomalous)
        # Typical range: [-0.5, 0.5], we map to [0, 1]
        anomaly_score = float(np.clip(0.5 - raw_score, 0.0, 1.0))
        is_anomaly = prediction == -1

        # Update stats
        self._stats["total_predictions"] += 1
        if is_anomaly:
            self._stats["anomaly_count"] += 1
        else:
            self._stats["normal_count"] += 1

        return {
            "is_anomaly": bool(is_anomaly),
            "score": round(anomaly_score, 4),
            "model_version": self.MODEL_VERSION,
            "is_demo": True,
        }

    def score(self, features: list[float]) -> float:
        """Get anomaly score for a feature vector.

        Args:
            features: Single feature vector.

        Returns:
            Anomaly score (0.0 to 1.0).
        """
        result = self.predict(features)
        return result["score"]

    def fit_on_normal_data(self, n_samples: int = 200) -> None:
        """Auto-fit the model on generated normal signal data.

        Generates synthetic normal signals, extracts features,
        and trains the model. This provides a baseline for
        anomaly detection in demo mode.

        Args:
            n_samples: Number of normal windows to generate.
        """
        from ..acquisition.generator import InfrasoundGenerator
        from ..signal_processing.features import extract_features, features_to_vector

        logger.info("Auto-fitting anomaly detector on %d normal windows", n_samples)

        gen = InfrasoundGenerator(sample_rate=100.0, seed=42)
        feature_vectors: list[list[float]] = []

        for _ in range(n_samples):
            chunk = gen.generate_chunk(n_samples=256)
            samples = chunk.to_numpy()
            feats = extract_features(samples, chunk.sample_rate)
            vec = features_to_vector(feats)
            feature_vectors.append(vec)

        self.fit(feature_vectors)

    @property
    def is_fitted(self) -> bool:
        """Check if the model has been trained."""
        return self._is_fitted

    @property
    def stats(self) -> dict:
        """Get prediction statistics."""
        return {
            **self._stats,
            "is_fitted": self._is_fitted,
            "model_version": self.MODEL_VERSION,
            "n_features": self._n_features,
        }

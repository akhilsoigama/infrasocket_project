"""Base classes for AI models."""

from abc import ABC, abstractmethod
from typing import Any


class BaseDetector(ABC):
    """Abstract base class for anomaly detectors."""

    @abstractmethod
    def fit(self, features: list[list[float]]) -> None:
        """Train the detector on a set of feature vectors.

        Args:
            features: List of feature vectors (training data).
        """

    @abstractmethod
    def predict(self, features: list[float]) -> dict[str, Any]:
        """Predict whether a feature vector is anomalous.

        Args:
            features: Single feature vector.

        Returns:
            Dictionary with at least 'is_anomaly' and 'score' keys.
        """

    @abstractmethod
    def score(self, features: list[float]) -> float:
        """Get anomaly score for a feature vector.

        Args:
            features: Single feature vector.

        Returns:
            Anomaly score (higher = more anomalous, typically).
        """


class BaseClassifier(ABC):
    """Abstract base class for event classifiers."""

    @abstractmethod
    def classify(self, features: list[float]) -> dict[str, Any]:
        """Classify a signal window based on features.

        Args:
            features: Feature vector.

        Returns:
            Classification result with label and confidence.
        """

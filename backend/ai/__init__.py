"""AI module for infrasound anomaly detection and classification.

Uses scikit-learn Isolation Forest for anomaly detection and
provides architecture for future PyTorch-based deep learning models.
"""

from .anomaly import AnomalyDetector
from .classifier import EventClassifier
from .inference import InferenceEngine

__all__ = ["AnomalyDetector", "EventClassifier", "InferenceEngine"]

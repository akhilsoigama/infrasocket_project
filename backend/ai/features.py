"""AI feature extraction utilities.

Wraps signal processing feature extraction for use
in the AI pipeline.
"""

import numpy as np
from numpy.typing import NDArray

from ..signal_processing.features import extract_features, features_to_vector


def prepare_features(
    signal: NDArray[np.float64],
    sample_rate: float,
) -> tuple[dict, list[float]]:
    """Extract features and prepare them for AI models.

    Args:
        signal: Raw signal array.
        sample_rate: Sampling rate (Hz).

    Returns:
        Tuple of (feature dict, feature vector).
    """
    feature_dict = extract_features(signal, sample_rate)
    feature_vec = features_to_vector(feature_dict)
    return feature_dict, feature_vec

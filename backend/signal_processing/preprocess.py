"""Signal preprocessing: normalization and detrending.

These operations prepare raw signals for downstream spectral
analysis and feature extraction.
"""

import numpy as np
from numpy.typing import NDArray
from scipy import signal as scipy_signal

Signal = NDArray[np.float64]


def normalize_signal(data: Signal, method: str = "zscore") -> Signal:
    """Normalize a signal array.

    Args:
        data: Input signal array.
        method: Normalization method.
            - 'zscore': Zero mean, unit variance.
            - 'minmax': Scale to [0, 1].
            - 'peak': Scale by peak absolute value.

    Returns:
        Normalized signal array.

    Raises:
        ValueError: If method is unknown or data is empty.
    """
    if len(data) == 0:
        raise ValueError("Cannot normalize empty signal")

    if method == "zscore":
        std = np.std(data)
        if std < 1e-12:
            return data - np.mean(data)
        return (data - np.mean(data)) / std

    elif method == "minmax":
        dmin, dmax = np.min(data), np.max(data)
        drange = dmax - dmin
        if drange < 1e-12:
            return np.zeros_like(data)
        return (data - dmin) / drange

    elif method == "peak":
        peak = np.max(np.abs(data))
        if peak < 1e-12:
            return data.copy()
        return data / peak

    else:
        raise ValueError(f"Unknown normalization method: {method}")


def detrend_signal(data: Signal, method: str = "linear") -> Signal:
    """Remove trend from a signal.

    Args:
        data: Input signal array.
        method: Detrending method.
            - 'linear': Remove linear trend.
            - 'constant': Remove mean (demean).
            - 'polynomial': Remove polynomial trend (degree 3).

    Returns:
        Detrended signal array.
    """
    if len(data) == 0:
        return data.copy()

    if method == "linear":
        return scipy_signal.detrend(data, type="linear")

    elif method == "constant":
        return scipy_signal.detrend(data, type="constant")

    elif method == "polynomial":
        x = np.arange(len(data))
        coeffs = np.polyfit(x, data, deg=3)
        trend = np.polyval(coeffs, x)
        return data - trend

    else:
        raise ValueError(f"Unknown detrend method: {method}")

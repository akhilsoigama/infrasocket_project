"""Digital filters for infrasound signal processing.

Implements bandpass, lowpass, and highpass Butterworth filters
using SciPy's signal processing module.
"""

import numpy as np
from numpy.typing import NDArray
from scipy.signal import butter, sosfiltfilt

Signal = NDArray[np.float64]


def bandpass_filter(
    data: Signal,
    low_freq: float,
    high_freq: float,
    sample_rate: float,
    order: int = 4,
) -> Signal:
    """Apply a Butterworth bandpass filter.

    Args:
        data: Input signal array.
        low_freq: Lower cutoff frequency (Hz).
        high_freq: Upper cutoff frequency (Hz).
        sample_rate: Sampling rate (Hz).
        order: Filter order.

    Returns:
        Bandpass-filtered signal.

    Raises:
        ValueError: If frequencies are invalid.
    """
    nyquist = sample_rate / 2.0

    if low_freq <= 0:
        raise ValueError(f"Low frequency must be positive, got {low_freq}")
    if high_freq >= nyquist:
        high_freq = nyquist * 0.95  # Clamp near Nyquist
    if low_freq >= high_freq:
        raise ValueError(
            f"Low freq ({low_freq}) must be less than high freq ({high_freq})"
        )

    sos = butter(order, [low_freq / nyquist, high_freq / nyquist], btype="band", output="sos")
    return sosfiltfilt(sos, data).astype(np.float64)


def lowpass_filter(
    data: Signal,
    cutoff_freq: float,
    sample_rate: float,
    order: int = 4,
) -> Signal:
    """Apply a Butterworth lowpass filter.

    Args:
        data: Input signal array.
        cutoff_freq: Cutoff frequency (Hz).
        sample_rate: Sampling rate (Hz).
        order: Filter order.

    Returns:
        Lowpass-filtered signal.
    """
    nyquist = sample_rate / 2.0
    if cutoff_freq >= nyquist:
        cutoff_freq = nyquist * 0.95

    sos = butter(order, cutoff_freq / nyquist, btype="low", output="sos")
    return sosfiltfilt(sos, data).astype(np.float64)


def highpass_filter(
    data: Signal,
    cutoff_freq: float,
    sample_rate: float,
    order: int = 4,
) -> Signal:
    """Apply a Butterworth highpass filter.

    Args:
        data: Input signal array.
        cutoff_freq: Cutoff frequency (Hz).
        sample_rate: Sampling rate (Hz).
        order: Filter order.

    Returns:
        Highpass-filtered signal.
    """
    nyquist = sample_rate / 2.0
    if cutoff_freq <= 0:
        raise ValueError(f"Cutoff frequency must be positive, got {cutoff_freq}")
    if cutoff_freq >= nyquist:
        raise ValueError(
            f"Cutoff frequency ({cutoff_freq}) must be less than Nyquist ({nyquist})"
        )

    sos = butter(order, cutoff_freq / nyquist, btype="high", output="sos")
    return sosfiltfilt(sos, data).astype(np.float64)

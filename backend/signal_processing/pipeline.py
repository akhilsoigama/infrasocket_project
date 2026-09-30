"""Signal processing pipeline.

Combines preprocessing, filtering, spectral analysis, and feature
extraction into a single reusable pipeline function.
"""

import logging
from typing import Optional

import numpy as np
from numpy.typing import NDArray

from .features import extract_features
from .fft import compute_fft
from .filters import bandpass_filter
from .preprocess import detrend_signal, normalize_signal
from .spectrogram import compute_stft

logger = logging.getLogger(__name__)

Signal = NDArray[np.float64]


def process_signal(
    data: Signal,
    sample_rate: float,
    detrend: bool = True,
    normalize: bool = True,
    filter_low: Optional[float] = None,
    filter_high: Optional[float] = None,
    compute_spectral: bool = True,
    stft_nperseg: int = 128,
) -> dict:
    """Process a signal through the complete analysis pipeline.

    Steps:
        1. Detrend (remove linear trend)
        2. Normalize (z-score)
        3. Bandpass filter (if frequencies specified)
        4. Compute FFT
        5. Compute STFT (spectrogram)
        6. Extract features

    Args:
        data: Input signal array.
        sample_rate: Sampling rate (Hz).
        detrend: Whether to detrend the signal.
        normalize: Whether to normalize the signal.
        filter_low: Low cutoff frequency for bandpass (Hz).
        filter_high: High cutoff frequency for bandpass (Hz).
        compute_spectral: Whether to compute FFT and STFT.
        stft_nperseg: Segment length for STFT.

    Returns:
        Dictionary containing:
            - processed_signal: The processed signal array.
            - features: Extracted feature dictionary.
            - fft: FFT result (if computed).
            - spectrogram: STFT result (if computed).
            - sample_rate: Sampling rate.
            - n_samples: Number of samples.
    """
    if len(data) == 0:
        return {
            "processed_signal": [],
            "features": {},
            "fft": None,
            "spectrogram": None,
            "sample_rate": sample_rate,
            "n_samples": 0,
        }

    processed = data.copy()

    # Step 1: Detrend
    if detrend:
        processed = detrend_signal(processed, method="linear")

    # Step 2: Normalize
    if normalize:
        processed = normalize_signal(processed, method="zscore")

    # Step 3: Filter
    if filter_low is not None and filter_high is not None:
        try:
            processed = bandpass_filter(
                processed, filter_low, filter_high, sample_rate
            )
        except ValueError as e:
            logger.warning("Bandpass filter skipped: %s", e)

    # Step 4-5: Spectral analysis
    fft_result = None
    stft_result = None

    if compute_spectral:
        fft_result = compute_fft(processed, sample_rate)
        stft_result = compute_stft(
            processed, sample_rate, nperseg=stft_nperseg
        )

    # Step 6: Features
    features = extract_features(processed, sample_rate)

    return {
        "processed_signal": processed.tolist(),
        "features": features,
        "fft": fft_result,
        "spectrogram": stft_result,
        "sample_rate": sample_rate,
        "n_samples": len(processed),
    }

"""Signal processing module for infrasound data.

Provides preprocessing, filtering, spectral analysis,
feature extraction, and a unified processing pipeline.
"""

from .features import extract_features
from .fft import compute_fft
from .filters import bandpass_filter, highpass_filter, lowpass_filter
from .pipeline import process_signal
from .preprocess import detrend_signal, normalize_signal
from .spectrogram import compute_stft

__all__ = [
    "normalize_signal",
    "detrend_signal",
    "bandpass_filter",
    "lowpass_filter",
    "highpass_filter",
    "compute_fft",
    "compute_stft",
    "extract_features",
    "process_signal",
]

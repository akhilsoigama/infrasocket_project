"""Feature extraction from infrasound signals.

Extracts statistical and spectral features from signal windows
for use in anomaly detection and classification.
"""

import numpy as np
from numpy.typing import NDArray

from .fft import compute_fft

Signal = NDArray[np.float64]


def calculate_rms(data: Signal) -> float:
    """Calculate Root Mean Square of a signal.

    Args:
        data: Input signal array.

    Returns:
        RMS value.
    """
    if len(data) == 0:
        return 0.0
    return float(np.sqrt(np.mean(data ** 2)))


def calculate_peak_amplitude(data: Signal) -> float:
    """Calculate peak absolute amplitude.

    Args:
        data: Input signal array.

    Returns:
        Peak amplitude value.
    """
    if len(data) == 0:
        return 0.0
    return float(np.max(np.abs(data)))


def calculate_energy(data: Signal) -> float:
    """Calculate signal energy (sum of squared amplitudes).

    Args:
        data: Input signal array.

    Returns:
        Total energy.
    """
    if len(data) == 0:
        return 0.0
    return float(np.sum(data ** 2))


def calculate_snr(data: Signal, noise_floor: float | None = None) -> float:
    """Calculate Signal-to-Noise Ratio in dB.

    If no noise floor is provided, estimates it from the
    lowest-energy quartile of the signal.

    Args:
        data: Input signal array.
        noise_floor: Known noise power. Estimated if None.

    Returns:
        SNR in decibels.
    """
    if len(data) < 4:
        return 0.0

    signal_power = float(np.mean(data ** 2))

    if noise_floor is None:
        # Estimate noise from lowest quartile of windowed energy
        window_size = max(len(data) // 8, 4)
        n_windows = len(data) // window_size
        if n_windows < 2:
            return 0.0
        energies = []
        for i in range(n_windows):
            w = data[i * window_size : (i + 1) * window_size]
            energies.append(float(np.mean(w ** 2)))
        energies.sort()
        # Use bottom 25% as noise estimate
        n_noise = max(1, n_windows // 4)
        noise_floor = float(np.mean(energies[:n_noise]))

    if noise_floor < 1e-20:
        return 60.0  # Cap at 60 dB if noise is negligible

    snr = 10.0 * np.log10(signal_power / noise_floor)
    return float(np.clip(snr, -20.0, 60.0))


def calculate_dominant_frequency(data: Signal, sample_rate: float) -> float:
    """Find the dominant frequency of a signal.

    Args:
        data: Input signal array.
        sample_rate: Sampling rate (Hz).

    Returns:
        Dominant frequency in Hz.
    """
    if len(data) < 4:
        return 0.0

    fft_result = compute_fft(data, sample_rate)
    frequencies = np.array(fft_result["frequencies"])
    magnitudes = np.array(fft_result["magnitudes"])

    if len(magnitudes) == 0:
        return 0.0

    # Skip DC component
    if len(magnitudes) > 1:
        magnitudes[0] = 0.0

    peak_idx = np.argmax(magnitudes)
    return float(frequencies[peak_idx])


def calculate_spectral_centroid(data: Signal, sample_rate: float) -> float:
    """Calculate the spectral centroid (center of mass of spectrum).

    Args:
        data: Input signal array.
        sample_rate: Sampling rate (Hz).

    Returns:
        Spectral centroid in Hz.
    """
    if len(data) < 4:
        return 0.0

    fft_result = compute_fft(data, sample_rate)
    frequencies = np.array(fft_result["frequencies"])
    magnitudes = np.array(fft_result["magnitudes"])

    total_mag = np.sum(magnitudes)
    if total_mag < 1e-12:
        return 0.0

    return float(np.sum(frequencies * magnitudes) / total_mag)


def calculate_zero_crossing_rate(data: Signal) -> float:
    """Calculate the zero-crossing rate.

    Args:
        data: Input signal array.

    Returns:
        Zero-crossing rate (crossings per sample).
    """
    if len(data) < 2:
        return 0.0

    signs = np.sign(data)
    crossings = np.sum(np.abs(np.diff(signs)) > 0)
    return float(crossings / (len(data) - 1))


def extract_features(
    data: Signal,
    sample_rate: float,
) -> dict:
    """Extract a comprehensive feature set from a signal window.

    Args:
        data: Input signal array.
        sample_rate: Sampling rate (Hz).

    Returns:
        Dictionary of extracted features.
    """
    duration = len(data) / sample_rate if sample_rate > 0 else 0.0

    return {
        "peak_amplitude": calculate_peak_amplitude(data),
        "rms": calculate_rms(data),
        "energy": calculate_energy(data),
        "snr_db": calculate_snr(data),
        "dominant_frequency_hz": calculate_dominant_frequency(data, sample_rate),
        "spectral_centroid_hz": calculate_spectral_centroid(data, sample_rate),
        "zero_crossing_rate": calculate_zero_crossing_rate(data),
        "duration_seconds": duration,
        "n_samples": len(data),
        "sample_rate": sample_rate,
        "mean": float(np.mean(data)) if len(data) > 0 else 0.0,
        "std": float(np.std(data)) if len(data) > 0 else 0.0,
        "skewness": float(_skewness(data)),
        "kurtosis": float(_kurtosis(data)),
    }


def features_to_vector(features: dict) -> list[float]:
    """Convert feature dictionary to a flat vector for ML input.

    Args:
        features: Feature dictionary from extract_features().

    Returns:
        List of float feature values.
    """
    keys = [
        "peak_amplitude",
        "rms",
        "energy",
        "snr_db",
        "dominant_frequency_hz",
        "spectral_centroid_hz",
        "zero_crossing_rate",
        "mean",
        "std",
        "skewness",
        "kurtosis",
    ]
    return [features.get(k, 0.0) for k in keys]


def _skewness(data: Signal) -> float:
    """Calculate skewness of signal."""
    if len(data) < 3:
        return 0.0
    mean = np.mean(data)
    std = np.std(data)
    if std < 1e-12:
        return 0.0
    return float(np.mean(((data - mean) / std) ** 3))


def _kurtosis(data: Signal) -> float:
    """Calculate excess kurtosis of signal."""
    if len(data) < 4:
        return 0.0
    mean = np.mean(data)
    std = np.std(data)
    if std < 1e-12:
        return 0.0
    return float(np.mean(((data - mean) / std) ** 4) - 3.0)

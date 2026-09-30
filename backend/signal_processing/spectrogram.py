"""STFT spectrogram computation for infrasound signals.

Uses SciPy's Short-Time Fourier Transform to produce
time-frequency representations of signals.
"""

import numpy as np
from numpy.typing import NDArray
from scipy.signal import stft as scipy_stft

Signal = NDArray[np.float64]


def compute_stft(
    data: Signal,
    sample_rate: float,
    nperseg: int = 256,
    noverlap: int | None = None,
    window: str = "hann",
    nfft: int | None = None,
) -> dict:
    """Compute the Short-Time Fourier Transform (spectrogram).

    Args:
        data: Input signal array.
        sample_rate: Sampling rate (Hz).
        nperseg: Segment length for STFT.
        noverlap: Number of overlapping points (default: nperseg // 2).
        window: Window function name.
        nfft: FFT size for each segment.

    Returns:
        Dictionary with:
            - times: Time bin centers (seconds).
            - frequencies: Frequency bin centers (Hz).
            - magnitudes: 2D magnitude array [freq x time].
            - phases: 2D phase array [freq x time].
            - nperseg: Segment size used.
            - noverlap: Overlap used.
    """
    n = len(data)
    if n == 0:
        return {
            "times": [],
            "frequencies": [],
            "magnitudes": [],
            "phases": [],
            "nperseg": nperseg,
            "noverlap": noverlap or 0,
        }

    # Adjust nperseg if signal is shorter
    if nperseg > n:
        nperseg = n

    if noverlap is None:
        noverlap = nperseg // 2

    if nfft is None:
        nfft = max(nperseg, 256)

    frequencies, times, zxx = scipy_stft(
        data,
        fs=sample_rate,
        window=window,
        nperseg=nperseg,
        noverlap=noverlap,
        nfft=nfft,
    )

    magnitudes = np.abs(zxx)
    phases = np.angle(zxx)

    return {
        "times": times.tolist(),
        "frequencies": frequencies.tolist(),
        "magnitudes": magnitudes.tolist(),
        "phases": phases.tolist(),
        "nperseg": nperseg,
        "noverlap": noverlap,
    }


def compute_spectrogram_db(
    data: Signal,
    sample_rate: float,
    nperseg: int = 256,
    noverlap: int | None = None,
    ref_power: float = 1.0,
) -> dict:
    """Compute spectrogram in decibels.

    Args:
        data: Input signal array.
        sample_rate: Sampling rate (Hz).
        nperseg: Segment length.
        noverlap: Overlap points.
        ref_power: Reference power for dB calculation.

    Returns:
        Dictionary with times, frequencies, and magnitude in dB.
    """
    result = compute_stft(data, sample_rate, nperseg, noverlap)

    magnitudes = np.array(result["magnitudes"])
    # Convert to dB with floor to avoid log(0)
    power = magnitudes ** 2
    power_db = 10.0 * np.log10(np.maximum(power, 1e-20) / ref_power)

    result["magnitudes_db"] = power_db.tolist()
    return result

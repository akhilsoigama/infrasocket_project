"""FFT computation for infrasound signals.

Computes the Fast Fourier Transform and returns frequency bins
with their corresponding magnitudes.
"""

import numpy as np
from numpy.typing import NDArray

Signal = NDArray[np.float64]


def compute_fft(
    data: Signal,
    sample_rate: float,
    n_fft: int | None = None,
    window: str = "hann",
) -> dict:
    """Compute the FFT of a signal.

    Args:
        data: Input signal array.
        sample_rate: Sampling rate (Hz).
        n_fft: FFT size. Defaults to signal length.
        window: Window function to apply before FFT.

    Returns:
        Dictionary with:
            - frequencies: Frequency bin centers (Hz).
            - magnitudes: Magnitude spectrum.
            - phases: Phase spectrum (radians).
            - n_fft: Actual FFT size used.
            - frequency_resolution: Frequency resolution (Hz).
    """
    n = len(data)
    if n == 0:
        return {
            "frequencies": [],
            "magnitudes": [],
            "phases": [],
            "n_fft": 0,
            "frequency_resolution": 0.0,
        }

    if n_fft is None:
        n_fft = n

    # Apply window
    if window == "hann":
        win = np.hanning(n)
    elif window == "hamming":
        win = np.hamming(n)
    elif window == "blackman":
        win = np.blackman(n)
    elif window == "rectangular" or window == "none":
        win = np.ones(n)
    else:
        win = np.hanning(n)

    windowed = data * win

    # Compute FFT
    fft_result = np.fft.rfft(windowed, n=n_fft)
    frequencies = np.fft.rfftfreq(n_fft, d=1.0 / sample_rate)
    magnitudes = np.abs(fft_result) * 2.0 / n  # Normalized magnitude
    phases = np.angle(fft_result)

    freq_resolution = sample_rate / n_fft

    return {
        "frequencies": frequencies.tolist(),
        "magnitudes": magnitudes.tolist(),
        "phases": phases.tolist(),
        "n_fft": n_fft,
        "frequency_resolution": freq_resolution,
    }


def compute_power_spectrum(
    data: Signal,
    sample_rate: float,
    n_fft: int | None = None,
) -> dict:
    """Compute the power spectral density.

    Args:
        data: Input signal array.
        sample_rate: Sampling rate (Hz).
        n_fft: FFT size.

    Returns:
        Dictionary with frequencies and PSD values.
    """
    fft_result = compute_fft(data, sample_rate, n_fft)

    magnitudes = np.array(fft_result["magnitudes"])
    psd = magnitudes ** 2

    return {
        "frequencies": fft_result["frequencies"],
        "psd": psd.tolist(),
        "n_fft": fft_result["n_fft"],
    }

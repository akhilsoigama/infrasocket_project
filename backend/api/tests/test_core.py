"""Tests for the signal generator."""

import numpy as np
import pytest

from ...acquisition.generator import InfrasoundGenerator
from ...acquisition.models import EventType


class TestInfrasoundGenerator:
    """Tests for InfrasoundGenerator."""

    def setup_method(self):
        self.gen = InfrasoundGenerator(sample_rate=100.0, seed=42)

    def test_generate_background(self):
        signal = self.gen.generate_background(256)
        assert len(signal) == 256
        assert isinstance(signal, np.ndarray)
        assert signal.dtype == np.float64

    def test_generate_microbarom_like(self):
        signal = self.gen.generate_microbarom_like(256)
        assert len(signal) == 256
        assert np.max(np.abs(signal)) > 0

    def test_generate_explosion_like(self):
        signal = self.gen.generate_explosion_like(500)
        assert len(signal) == 500
        # Should have some significant amplitude
        assert np.max(np.abs(signal)) > 0.1

    def test_generate_meteor_like(self):
        signal = self.gen.generate_meteor_like(500)
        assert len(signal) == 500

    def test_generate_volcanic_like(self):
        signal = self.gen.generate_volcanic_like(500)
        assert len(signal) == 500

    def test_generate_random_anomaly(self):
        signal = self.gen.generate_random_anomaly(256)
        assert len(signal) == 256

    def test_generate_chunk(self):
        chunk = self.gen.generate_chunk(n_samples=256)
        assert len(chunk.samples) == 256
        assert chunk.sample_rate == 100.0
        assert chunk.station_id == "INFRA-001"

    def test_inject_event(self):
        event = self.gen.inject_event(EventType.EXPLOSION_LIKE)
        assert event.event_type == EventType.EXPLOSION_LIKE
        assert self.gen.has_pending_event

        chunk = self.gen.generate_chunk(n_samples=256)
        assert chunk.event_type == EventType.EXPLOSION_LIKE

    def test_stream_samples(self):
        chunks = []
        for i, chunk in enumerate(self.gen.stream_samples(chunk_size=100)):
            chunks.append(chunk)
            if i >= 4:
                break
        assert len(chunks) == 5
        for c in chunks:
            assert len(c.samples) == 100


class TestSignalProcessing:
    """Tests for signal processing functions."""

    def setup_method(self):
        self.gen = InfrasoundGenerator(sample_rate=100.0, seed=42)
        chunk = self.gen.generate_chunk(n_samples=512)
        self.signal = chunk.to_numpy()
        self.sample_rate = 100.0

    def test_normalize_zscore(self):
        from ...signal_processing.preprocess import normalize_signal

        normed = normalize_signal(self.signal, method="zscore")
        assert len(normed) == len(self.signal)
        assert abs(np.mean(normed)) < 0.01
        assert abs(np.std(normed) - 1.0) < 0.01

    def test_normalize_minmax(self):
        from ...signal_processing.preprocess import normalize_signal

        normed = normalize_signal(self.signal, method="minmax")
        assert np.min(normed) >= -0.01
        assert np.max(normed) <= 1.01

    def test_normalize_peak(self):
        from ...signal_processing.preprocess import normalize_signal

        normed = normalize_signal(self.signal, method="peak")
        assert np.max(np.abs(normed)) <= 1.01

    def test_detrend(self):
        from ...signal_processing.preprocess import detrend_signal

        detrended = detrend_signal(self.signal, method="linear")
        assert len(detrended) == len(self.signal)

    def test_bandpass_filter(self):
        from ...signal_processing.filters import bandpass_filter

        filtered = bandpass_filter(self.signal, 0.5, 10.0, self.sample_rate)
        assert len(filtered) == len(self.signal)

    def test_lowpass_filter(self):
        from ...signal_processing.filters import lowpass_filter

        filtered = lowpass_filter(self.signal, 10.0, self.sample_rate)
        assert len(filtered) == len(self.signal)

    def test_highpass_filter(self):
        from ...signal_processing.filters import highpass_filter

        filtered = highpass_filter(self.signal, 1.0, self.sample_rate)
        assert len(filtered) == len(self.signal)

    def test_compute_fft(self):
        from ...signal_processing.fft import compute_fft

        result = compute_fft(self.signal, self.sample_rate)
        assert len(result["frequencies"]) > 0
        assert len(result["magnitudes"]) > 0
        assert result["n_fft"] > 0

    def test_compute_stft(self):
        from ...signal_processing.spectrogram import compute_stft

        result = compute_stft(self.signal, self.sample_rate, nperseg=64)
        assert len(result["times"]) > 0
        assert len(result["frequencies"]) > 0
        assert len(result["magnitudes"]) > 0

    def test_extract_features(self):
        from ...signal_processing.features import extract_features

        features = extract_features(self.signal, self.sample_rate)
        assert "rms" in features
        assert "snr_db" in features
        assert "peak_amplitude" in features
        assert "dominant_frequency_hz" in features
        assert features["rms"] > 0

    def test_pipeline(self):
        from ...signal_processing.pipeline import process_signal

        result = process_signal(self.signal, self.sample_rate)
        assert "processed_signal" in result
        assert "features" in result
        assert "fft" in result
        assert "spectrogram" in result


class TestAnomalyDetector:
    """Tests for the anomaly detector."""

    def test_fit_and_predict(self):
        from ...ai.anomaly import AnomalyDetector

        detector = AnomalyDetector(contamination=0.1)
        detector.fit_on_normal_data(n_samples=50)

        assert detector.is_fitted

        gen = InfrasoundGenerator(sample_rate=100.0, seed=99)
        chunk = gen.generate_chunk(n_samples=256)

        from ...signal_processing.features import (
            extract_features,
            features_to_vector,
        )

        features = extract_features(chunk.to_numpy(), chunk.sample_rate)
        vec = features_to_vector(features)
        result = detector.predict(vec)

        assert "is_anomaly" in result
        assert "score" in result
        assert "model_version" in result
        assert result["is_demo"] is True

    def test_unfitted_predict(self):
        from ...ai.anomaly import AnomalyDetector

        detector = AnomalyDetector()
        result = detector.predict([0.0] * 11)
        assert result["is_anomaly"] is False
        assert "error" in result


class TestInferenceEngine:
    """Tests for the inference engine."""

    def test_analyze_window(self):
        from ...ai.inference import InferenceEngine

        engine = InferenceEngine()

        gen = InfrasoundGenerator(sample_rate=100.0, seed=42)
        chunk = gen.generate_chunk(n_samples=256)

        result = engine.analyze_window(chunk.to_numpy(), chunk.sample_rate)
        assert "anomaly" in result
        assert "classification" in result
        assert "features" in result
        assert engine.is_ready

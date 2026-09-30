"""Dataset loading and playback for recorded infrasound data.

Supports CSV, TXT, and NPY file formats.
Architecture prepared for miniSEED and SAC formats (future).
"""

import logging
from enum import Enum
from pathlib import Path
from typing import Optional

import numpy as np
from numpy.typing import NDArray

from .models import SignalChunk

logger = logging.getLogger(__name__)


class DatasetFormat(str, Enum):
    """Supported dataset file formats."""

    CSV = "csv"
    TXT = "txt"
    NPY = "npy"
    # Future formats:
    # MINISEED = "miniseed"
    # SAC = "sac"


class DatasetPlayer:
    """Loads and plays back recorded infrasound datasets.

    Supports streaming chunks from loaded data at the configured
    sample rate, with play/pause/stop controls.
    """

    def __init__(self, sample_rate: float = 100.0) -> None:
        self.sample_rate = sample_rate
        self._data: Optional[NDArray[np.float64]] = None
        self._position: int = 0
        self._is_playing: bool = False
        self._is_paused: bool = False
        self._metadata: dict = {}

    def load_dataset(
        self,
        filepath: str,
        format_hint: Optional[DatasetFormat] = None,
        column: int = 0,
        sample_rate: Optional[float] = None,
    ) -> dict:
        """Load a dataset from file.

        Args:
            filepath: Path to the data file.
            format_hint: File format. Auto-detected if None.
            column: Column index for CSV/TXT files.
            sample_rate: Override sample rate if known.

        Returns:
            Metadata dictionary about the loaded dataset.

        Raises:
            FileNotFoundError: If the file doesn't exist.
            ValueError: If format is unsupported or data is invalid.
        """
        path = Path(filepath)
        if not path.exists():
            raise FileNotFoundError(f"Dataset file not found: {filepath}")

        fmt = format_hint or self._detect_format(path)

        if fmt == DatasetFormat.CSV:
            data = np.loadtxt(str(path), delimiter=",", usecols=column)
        elif fmt == DatasetFormat.TXT:
            data = np.loadtxt(str(path), usecols=column)
        elif fmt == DatasetFormat.NPY:
            data = np.load(str(path))
        else:
            raise ValueError(f"Unsupported format: {fmt}")

        data = data.astype(np.float64).flatten()
        if len(data) == 0:
            raise ValueError("Dataset is empty")

        self._data = data
        self._position = 0

        if sample_rate is not None:
            self.sample_rate = sample_rate

        self._metadata = self.get_metadata()
        logger.info(
            "Loaded dataset: %s (%d samples, %.1f Hz)",
            path.name,
            len(data),
            self.sample_rate,
        )
        return self._metadata

    def validate_dataset(self) -> dict:
        """Validate the loaded dataset.

        Returns:
            Validation result with status and any issues.
        """
        issues: list[str] = []

        if self._data is None:
            return {"valid": False, "issues": ["No dataset loaded"]}

        if len(self._data) < 10:
            issues.append("Dataset too short (< 10 samples)")

        if np.any(np.isnan(self._data)):
            nan_count = int(np.sum(np.isnan(self._data)))
            issues.append(f"Contains {nan_count} NaN values")

        if np.any(np.isinf(self._data)):
            inf_count = int(np.sum(np.isinf(self._data)))
            issues.append(f"Contains {inf_count} Inf values")

        max_val = float(np.max(np.abs(self._data)))
        if max_val > 1e6:
            issues.append(f"Very large values detected (max: {max_val:.2e})")

        return {
            "valid": len(issues) == 0,
            "issues": issues,
            "n_samples": len(self._data),
            "duration_seconds": len(self._data) / self.sample_rate,
        }

    def get_metadata(self) -> dict:
        """Get metadata about the loaded dataset.

        Returns:
            Dictionary with dataset statistics.
        """
        if self._data is None:
            return {"loaded": False}

        return {
            "loaded": True,
            "n_samples": len(self._data),
            "sample_rate": self.sample_rate,
            "duration_seconds": len(self._data) / self.sample_rate,
            "min": float(np.min(self._data)),
            "max": float(np.max(self._data)),
            "mean": float(np.mean(self._data)),
            "std": float(np.std(self._data)),
            "position": self._position,
            "progress": self._position / len(self._data) if len(self._data) > 0 else 0,
        }

    def play(self) -> None:
        """Start or resume playback."""
        if self._data is None:
            raise RuntimeError("No dataset loaded")
        self._is_playing = True
        self._is_paused = False

    def pause(self) -> None:
        """Pause playback."""
        self._is_paused = True

    def stop(self) -> None:
        """Stop playback and reset position."""
        self._is_playing = False
        self._is_paused = False
        self._position = 0

    def get_next_chunk(
        self,
        chunk_size: int = 256,
        station_id: str = "DATASET-001",
    ) -> Optional[SignalChunk]:
        """Get the next chunk of data from the dataset.

        Args:
            chunk_size: Number of samples per chunk.
            station_id: Station identifier for the chunk.

        Returns:
            SignalChunk or None if playback is stopped or dataset exhausted.
        """
        if not self._is_playing or self._is_paused or self._data is None:
            return None

        if self._position >= len(self._data):
            self._is_playing = False
            return None

        end = min(self._position + chunk_size, len(self._data))
        samples = self._data[self._position : end]
        self._position = end

        return SignalChunk.from_numpy(
            station_id=station_id,
            samples=samples,
            sample_rate=self.sample_rate,
        )

    @property
    def is_playing(self) -> bool:
        """Check if dataset is currently playing."""
        return self._is_playing and not self._is_paused

    @property
    def progress(self) -> float:
        """Get playback progress (0.0 to 1.0)."""
        if self._data is None or len(self._data) == 0:
            return 0.0
        return self._position / len(self._data)

    @staticmethod
    def _detect_format(path: Path) -> DatasetFormat:
        """Auto-detect file format from extension."""
        ext = path.suffix.lower()
        format_map = {
            ".csv": DatasetFormat.CSV,
            ".txt": DatasetFormat.TXT,
            ".npy": DatasetFormat.NPY,
        }
        if ext not in format_map:
            raise ValueError(
                f"Cannot detect format for extension '{ext}'. "
                f"Supported: {list(format_map.keys())}"
            )
        return format_map[ext]

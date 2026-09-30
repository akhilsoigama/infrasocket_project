"""PyTorch model architecture for future deep learning models.

This module provides a prepared CNN architecture that can accept
spectrogram images or raw waveform windows for classification.

STATUS: Experimental / Future Model
This architecture is prepared but not trained for production use.
"""

import logging
from typing import Optional

logger = logging.getLogger(__name__)

try:
    import torch
    import torch.nn as nn
    import torch.nn.functional as F

    TORCH_AVAILABLE = True
except ImportError:
    TORCH_AVAILABLE = False
    logger.info("PyTorch not available — advanced model features disabled")


if TORCH_AVAILABLE:

    class SpectrogramCNN(nn.Module):
        """CNN model for spectrogram-based classification.

        Architecture:
            Spectrogram Image (1 x H x W)
            ↓ Conv2D(1, 32, 3x3) + ReLU + MaxPool
            ↓ Conv2D(32, 64, 3x3) + ReLU + MaxPool
            ↓ Conv2D(64, 128, 3x3) + ReLU + AdaptiveAvgPool
            ↓ Flatten
            ↓ Linear(128, 64) + ReLU + Dropout
            ↓ Linear(64, n_classes)

        This is a minimal architecture prepared for future training
        on labeled infrasound spectrogram data.
        """

        def __init__(self, n_classes: int = 5) -> None:
            super().__init__()
            self.conv1 = nn.Conv2d(1, 32, kernel_size=3, padding=1)
            self.bn1 = nn.BatchNorm2d(32)
            self.conv2 = nn.Conv2d(32, 64, kernel_size=3, padding=1)
            self.bn2 = nn.BatchNorm2d(64)
            self.conv3 = nn.Conv2d(64, 128, kernel_size=3, padding=1)
            self.bn3 = nn.BatchNorm2d(128)
            self.pool = nn.MaxPool2d(2, 2)
            self.adaptive_pool = nn.AdaptiveAvgPool2d((4, 4))
            self.fc1 = nn.Linear(128 * 4 * 4, 64)
            self.dropout = nn.Dropout(0.3)
            self.fc2 = nn.Linear(64, n_classes)

        def forward(self, x: "torch.Tensor") -> "torch.Tensor":
            """Forward pass.

            Args:
                x: Input tensor (batch x 1 x height x width).

            Returns:
                Class logits (batch x n_classes).
            """
            x = self.pool(F.relu(self.bn1(self.conv1(x))))
            x = self.pool(F.relu(self.bn2(self.conv2(x))))
            x = F.relu(self.bn3(self.conv3(x)))
            x = self.adaptive_pool(x)
            x = x.view(x.size(0), -1)
            x = F.relu(self.fc1(x))
            x = self.dropout(x)
            x = self.fc2(x)
            return x

    class WaveformCNN1D(nn.Module):
        """1D CNN for raw waveform classification.

        Architecture:
            Raw Waveform (1 x L)
            ↓ Conv1D(1, 32, 7) + ReLU + MaxPool
            ↓ Conv1D(32, 64, 5) + ReLU + MaxPool
            ↓ Conv1D(64, 128, 3) + ReLU + AdaptiveAvgPool
            ↓ Linear(128, 64) + ReLU + Dropout
            ↓ Linear(64, n_classes)
        """

        def __init__(self, n_classes: int = 5) -> None:
            super().__init__()
            self.conv1 = nn.Conv1d(1, 32, kernel_size=7, padding=3)
            self.bn1 = nn.BatchNorm1d(32)
            self.conv2 = nn.Conv1d(32, 64, kernel_size=5, padding=2)
            self.bn2 = nn.BatchNorm1d(64)
            self.conv3 = nn.Conv1d(64, 128, kernel_size=3, padding=1)
            self.bn3 = nn.BatchNorm1d(128)
            self.pool = nn.MaxPool1d(2)
            self.adaptive_pool = nn.AdaptiveAvgPool1d(8)
            self.fc1 = nn.Linear(128 * 8, 64)
            self.dropout = nn.Dropout(0.3)
            self.fc2 = nn.Linear(64, n_classes)

        def forward(self, x: "torch.Tensor") -> "torch.Tensor":
            x = self.pool(F.relu(self.bn1(self.conv1(x))))
            x = self.pool(F.relu(self.bn2(self.conv2(x))))
            x = F.relu(self.bn3(self.conv3(x)))
            x = self.adaptive_pool(x)
            x = x.view(x.size(0), -1)
            x = F.relu(self.fc1(x))
            x = self.dropout(x)
            x = self.fc2(x)
            return x

else:
    # Stub classes when PyTorch is not installed
    class SpectrogramCNN:  # type: ignore
        """Stub — PyTorch not available."""

        def __init__(self, *args, **kwargs):
            raise ImportError("PyTorch is required for SpectrogramCNN")

    class WaveformCNN1D:  # type: ignore
        """Stub — PyTorch not available."""

        def __init__(self, *args, **kwargs):
            raise ImportError("PyTorch is required for WaveformCNN1D")

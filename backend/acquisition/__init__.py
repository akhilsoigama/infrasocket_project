"""Infrasound data acquisition module.

Provides synthetic signal generation for demo mode,
dataset loading, and streaming infrastructure.
"""

from .generator import InfrasoundGenerator
from .models import SignalChunk, StationConfig

__all__ = ["InfrasoundGenerator", "SignalChunk", "StationConfig"]

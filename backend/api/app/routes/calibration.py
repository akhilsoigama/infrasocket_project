"""Calibration and performance testing endpoints.

Provides endpoints for retrieving laboratory calibration benchmarks,
acoustic noise-floor specifications, frequency response tolerances,
and test statuses (distinguishing measured results from planned tests).
"""

from typing import Any, Dict
from fastapi import APIRouter

from acquisition.calibration import get_calibration_benchmarks

router = APIRouter(prefix="/calibration", tags=["calibration"])


@router.get("/benchmarks")
async def get_benchmarks() -> Dict[str, Any]:
    """Retrieve laboratory calibration and performance testing specifications.
    
    Includes:
    - Frequency response (0.01 - 20.0 Hz)
    - Acoustic self-noise floor vs Peterson Low-Noise Model
    - Sensitivity & linearity
    - Thermal coefficient & long-term baseline drift
    
    Clearly highlights tests that are pending physical laboratory verification.
    """
    return get_calibration_benchmarks()

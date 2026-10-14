"""Calibration and performance testing data definitions for atmospheric microbarometers.

Provides structured records for laboratory and field performance tests:
- Frequency-response measurements (target 0.01 - 20.0 Hz)
- Acoustic noise-floor measurements (vs Peterson Low-Noise Models)
- Sensitivity estimates (nominal & calibrated)
- Stability and drift over time
- Thermal sensitivity & operating conditions
- Calibration references and methods (e.g. pistonphone, acoustic coupler)

Strictly distinguishes between 'measured' empirical results and 'pending_validation' / 'planned' benchmarks.
"""

from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
from typing import Any, Dict, List, Optional


class ValidationStatus(str, Enum):
    """Scientific validation status."""
    MEASURED = "measured"                       # Verified with physical reference
    PENDING_VALIDATION = "pending_validation"   # Test procedure defined, awaiting lab session
    NOT_MEASURED = "not_measured"               # Hardware/setup not yet available
    PLANNED_TEST = "planned_test"               # Protocol scheduled


@dataclass
class FrequencyResponseBenchmark:
    """Frequency response benchmark documentation across target band 0.01 - 20 Hz."""
    target_frequency_range_hz: tuple[float, float] = (0.01, 20.0)
    validation_status: ValidationStatus = ValidationStatus.PENDING_VALIDATION
    method: str = "Acoustic Coupler / Reference Infrasound Chamber"
    reference_transducer: str = "Reference Pistonphone / Calibrated Infrasound Sensor"
    flat_band_tolerance_db: float = 3.0  # Acceptable flatness deviation
    lower_corner_frequency_hz: float = 0.01
    upper_corner_frequency_hz: float = 20.0
    measured_data_points: List[Dict[str, float]] = field(default_factory=list)
    measurement_date: Optional[str] = None
    notes: str = "Laboratory acoustic chamber sweep pending. Target band is 0.01 to 20.0 Hz."


@dataclass
class NoiseFloorBenchmark:
    """Acoustic self-noise PSD benchmark vs Atmospheric Low-Noise Model (ALNM)."""
    validation_status: ValidationStatus = ValidationStatus.PENDING_VALIDATION
    target_noise_floor_db: float = -60.0  # dB rel 1 Pa^2/Hz at 1 Hz
    alnm_compliance_band: tuple[float, float] = (0.05, 5.0)
    chamber_environment: str = "Sealed Acoustic Isolation Vessel"
    measured_psd_points: List[Dict[str, float]] = field(default_factory=list)
    measurement_date: Optional[str] = None
    notes: str = "Self-noise floor evaluation pending acoustic isolation testing."


@dataclass
class SensitivityBenchmark:
    """Transducer sensitivity calibration."""
    validation_status: ValidationStatus = ValidationStatus.PENDING_VALIDATION
    nominal_sensitivity: Optional[float] = None  # e.g. mV/Pa or counts/Pa
    nominal_units: str = "mV/Pa"
    calibrated_sensitivity: Optional[float] = None
    calibration_method: str = "Static / Dynamic Pistonphone Calibration"
    calibration_date: Optional[str] = None
    uncertainty_percent: Optional[float] = None
    notes: str = "Awaiting factory/laboratory pressure step or dynamic calibrator test."


@dataclass
class EnvironmentalStabilityBenchmark:
    """Thermal coefficient, drift, and pressure vessel stability."""
    validation_status: ValidationStatus = ValidationStatus.PENDING_VALIDATION
    operating_temperature_min_c: float = -20.0
    operating_temperature_max_c: float = 50.0
    thermal_drift_pa_per_c: Optional[float] = None
    long_term_dc_drift_pa_per_hour: Optional[float] = None
    test_duration_hours: Optional[float] = None
    test_date: Optional[str] = None
    notes: str = "Long-term thermal chamber stability test planned."


def get_calibration_benchmarks() -> Dict[str, Any]:
    """Retrieve full calibration specification suite with verified vs planned statuses."""
    return {
        "system_name": "InfraSocket Atmospheric Microbarometer Monitoring System",
        "target_frequency_range": {
            "min_hz": 0.01,
            "max_hz": 20.0,
            "scientific_significance": "Covers atmospheric gravity waves, microbaroms (0.1-0.5 Hz), volcanic tremors, bolides, and transient blast shockwaves."
        },
        "overall_hardware_status": "PENDING_LABORATORY_VALIDATION",
        "disclaimer": "The software signal processing and visualization modules are fully functional for recorded data and streaming architectures. Physical microbarometer hardware characterization is currently under test.",
        "tests": [
            {
                "test_id": "CAL-01",
                "name": "Frequency Response (0.01 - 20.0 Hz)",
                "category": "Acoustic Bandwidth",
                "status": ValidationStatus.PENDING_VALIDATION.value,
                "target_spec": "Flat amplitude response within ±3 dB across 0.01 Hz to 20.0 Hz",
                "calibration_method": "Closed-cavity acoustic excitation sweep with reference microbarometer",
                "reference_device": "Calibrated laboratory reference infrasound sensor",
                "test_date": None,
                "measured_result": "Pending validation",
                "empirical_data_available": False,
                "notes": "Target response curve defined. Sweep measurements will be logged upon bench session completion."
            },
            {
                "test_id": "CAL-02",
                "name": "Instrument Self-Noise Floor",
                "category": "Noise Characterization",
                "status": ValidationStatus.PENDING_VALIDATION.value,
                "target_spec": "< -60 dB rel 1 Pa²/Hz at 1.0 Hz (Below ambient wind noise floor in quiet conditions)",
                "calibration_method": "Dual-sensor coherent self-noise test in rigid acoustic isolation vessel",
                "reference_device": "Co-located low-noise reference microbarometer",
                "test_date": None,
                "measured_result": "Pending validation",
                "empirical_data_available": False,
                "notes": "Acoustic vessel preparation in progress. Awaiting two-sensor incoherent noise cancellation trial."
            },
            {
                "test_id": "CAL-03",
                "name": "Transducer Sensitivity & Linearity",
                "category": "Sensitivity",
                "status": ValidationStatus.PENDING_VALIDATION.value,
                "target_spec": "Linear dynamic range > 80 dB, dynamic pressure range ±50 Pa (high sensitivity) to ±1000 Pa (low sensitivity)",
                "calibration_method": "Precision sinusoidal pistonphone at 1.0 Hz with stepped displacement",
                "reference_device": "Laser-interferometer calibrated piston displacement",
                "test_date": None,
                "measured_result": "Pending validation",
                "empirical_data_available": False,
                "notes": "Transducer electronic gain stages assembled; pistonphone linearity test scheduled."
            },
            {
                "test_id": "CAL-04",
                "name": "Thermal Coefficient & Baseline Drift",
                "category": "Environmental Stability",
                "status": ValidationStatus.PENDING_VALIDATION.value,
                "target_spec": "Baseline drift < 0.05 Pa/hour; thermal coefficient < 0.1 Pa/°C over -10°C to +40°C",
                "calibration_method": "Environmental chamber step heating from -10°C to +40°C over 48 hours",
                "reference_device": "Calibrated digital barometric pressure transmitter & RTD probe",
                "test_date": None,
                "measured_result": "Pending validation",
                "empirical_data_available": False,
                "notes": "Thermal insulation enclosure design completed. Chamber temperature-cycling test planned."
            },
        ],
        "recorded_dataset_reference": {
            "ima_array": {
                "name": "IMA Array (Beirut 2020 Explosion)",
                "status": "VALIDATED_RECORDED_DATA",
                "sample_rate_hz": 40.0,
                "nyquist_hz": 20.0,
                "infrasound_band_hz": [0.01, 5.0],
                "units": "Pascal (Pa)"
            },
            "encr_array": {
                "name": "ENCR Station & Array (Mount Etna Volcanic Activity)",
                "status": "VALIDATED_RECORDED_DATA",
                "sample_rate_hz": 20.0,
                "nyquist_hz": 10.0,
                "infrasound_band_hz": [0.01, 5.0],
                "units": "Calibrated Acoustic Pressure (Pa)"
            }
        }
    }

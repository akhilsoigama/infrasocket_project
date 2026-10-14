"""Hardware integration architecture for atmospheric microbarometers.

Provides a modular acquisition interface layer separating:
- Sensor communication
- Data acquisition & buffering
- Data validation & timestamps
- Pipeline integration

Pipeline stages:
Atmospheric Pressure Fluctuations
  -> Microbarometer Sensing Assembly
  -> Sensor Interface / Signal Conditioning
  -> Digitizer or DAQ, where required
  -> Acquisition Service
  -> InfraSocket Data Pipeline
  -> Live Waveform and Signal Analysis
"""

import abc
import logging
from dataclasses import dataclass, field
from datetime import datetime, timezone
from enum import Enum
from typing import Any, Dict, List, Optional, Tuple

import numpy as np

logger = logging.getLogger(__name__)


class ConnectionStatus(str, Enum):
    """Hardware connection states."""
    DISCONNECTED = "disconnected"
    CONNECTING = "connecting"
    CONNECTED = "connected"
    STANDBY = "standby"
    ERROR = "error"


class HardwareInterfaceType(str, Enum):
    """Categories of hardware communication interfaces."""
    SERIAL_STREAM = "serial_stream"          # RS-232 / RS-422 / USB CDC Virtual COM
    ETHERNET_TCP = "ethernet_tcp"            # Digitizer TCP/IP or SeedLink
    ANALOG_DAQ = "analog_daq"                # External ADC / DAQ board (0-5V or 4-20mA)
    DIRECT_DIGITAL = "direct_digital"        # Integrated digitizer (I2C/SPI on SBC)
    NOT_CONFIGURED = "not_configured"


@dataclass
class HardwareDeviceInfo:
    """Descriptor for connected or configured microbarometer hardware."""
    device_id: str = "NONE"
    model_name: str = "Unspecified Microbarometer"
    interface_type: HardwareInterfaceType = HardwareInterfaceType.NOT_CONFIGURED
    supported_frequency_range: Tuple[float, float] = (0.01, 20.0)  # Target Hz
    nominal_sample_rate: float = 40.0
    sensitivity_nominal: Optional[float] = None  # e.g., V/Pa or counts/Pa
    sensitivity_units: str = "V/Pa"
    input_voltage_range: Optional[Tuple[float, float]] = None
    serial_port: Optional[str] = None
    ip_address: Optional[str] = None
    port: Optional[int] = None
    has_integrated_digitizer: bool = True
    calibration_date: Optional[str] = None
    status: ConnectionStatus = ConnectionStatus.DISCONNECTED
    status_message: str = "No physical microbarometer connected."


class BaseSensorAdapter(abc.ABC):
    """Abstract base class for all microbarometer hardware adapters.
    
    Hardware-specific drivers (USB, Serial, SeedLink, LabJack, NI-DAQ)
    must implement this interface to integrate into the InfraSocket pipeline.
    """

    @abc.abstractmethod
    def connect(self) -> bool:
        """Establish connection with the sensor/digitizer.
        
        Returns:
            True if connection was established, False otherwise.
        """
        pass

    @abc.abstractmethod
    def disconnect(self) -> None:
        """Gracefully close the hardware connection."""
        pass

    @abc.abstractmethod
    def is_connected(self) -> bool:
        """Check whether the hardware is actively connected."""
        pass

    @abc.abstractmethod
    def read_samples(self, max_samples: int = 100) -> Tuple[np.ndarray, Optional[str]]:
        """Acquire latest raw samples from the hardware buffer.
        
        Returns:
            Tuple of (numpy float64 array of pressure readings, timestamp isoformat)
        """
        pass

    @abc.abstractmethod
    def get_info(self) -> HardwareDeviceInfo:
        """Retrieve hardware device metadata and status."""
        pass


class DisconnectedSensorAdapter(BaseSensorAdapter):
    """Default adapter representing the state where no physical hardware is connected.
    
    Ensures that when no hardware is present, the system cleanly reports
    'Live sensor not connected' without fabricating readings or connections.
    """

    def __init__(self) -> None:
        self._info = HardwareDeviceInfo(
            device_id="NONE",
            model_name="Physical Microbarometer (Standby)",
            interface_type=HardwareInterfaceType.NOT_CONFIGURED,
            supported_frequency_range=(0.01, 20.0),
            nominal_sample_rate=0.0,
            status=ConnectionStatus.DISCONNECTED,
            status_message="Live sensor not connected. Ready for hardware integration.",
        )

    def connect(self) -> bool:
        # Without actual hardware drivers attached, report realistic connection result
        logger.info("Attempted to connect to microbarometer: No physical hardware detected.")
        self._info.status = ConnectionStatus.DISCONNECTED
        self._info.status_message = "Live sensor not connected. No physical digitizer/port detected."
        return False

    def disconnect(self) -> None:
        self._info.status = ConnectionStatus.DISCONNECTED
        self._info.status_message = "Live sensor not connected."

    def is_connected(self) -> bool:
        return False

    def read_samples(self, max_samples: int = 100) -> Tuple[np.ndarray, Optional[str]]:
        return np.array([], dtype=np.float64), None

    def get_info(self) -> HardwareDeviceInfo:
        return self._info


class HardwareAcquisitionManager:
    """Coordinates hardware adapters and buffers acquired sensor samples.
    
    Separates low-level sensor communications from the signal processing
    and WebSocket broadcasting pipelines.
    """

    def __init__(self) -> None:
        self._adapter: BaseSensorAdapter = DisconnectedSensorAdapter()
        self._target_frequency_range = (0.01, 20.0)
        self._latest_pressure_pa: Optional[float] = None
        self._last_read_timestamp: Optional[str] = None
        self._buffer: List[float] = []
        self._max_buffer: int = 4096

    @property
    def adapter(self) -> BaseSensorAdapter:
        return self._adapter

    def set_adapter(self, adapter: BaseSensorAdapter) -> None:
        """Swap hardware adapter (e.g. when configuring physical digitizer)."""
        if self._adapter.is_connected():
            self._adapter.disconnect()
        self._adapter = adapter
        logger.info("Hardware adapter configured: %s", adapter.get_info().model_name)

    def connect(self) -> bool:
        """Attempt connection via active adapter."""
        return self._adapter.connect()

    def disconnect(self) -> None:
        """Disconnect active adapter."""
        self._adapter.disconnect()
        self._latest_pressure_pa = None

    def poll_samples(self, max_samples: int = 100) -> Tuple[np.ndarray, Optional[str]]:
        """Read data from active adapter, updating internal buffers and timestamps."""
        if not self._adapter.is_connected():
            return np.array([], dtype=np.float64), None

        samples, ts = self._adapter.read_samples(max_samples)
        if len(samples) > 0:
            self._latest_pressure_pa = float(samples[-1])
            self._last_read_timestamp = ts or datetime.now(timezone.utc).isoformat()
            self._buffer.extend(samples.tolist())
            if len(self._buffer) > self._max_buffer:
                self._buffer = self._buffer[-self._max_buffer:]
        return samples, ts

    def get_status(self) -> Dict[str, Any]:
        """Get comprehensive hardware status for telemetry and UI consumption."""
        info = self._adapter.get_info()
        return {
            "is_connected": self._adapter.is_connected(),
            "connection_state": info.status.value,
            "status_message": info.status_message,
            "model_name": info.model_name,
            "device_id": info.device_id,
            "interface_type": info.interface_type.value,
            "target_frequency_range_hz": {
                "min": self._target_frequency_range[0],
                "max": self._target_frequency_range[1],
            },
            "nominal_sample_rate": info.nominal_sample_rate,
            "latest_measured_pressure_pa": self._latest_pressure_pa,
            "last_read_timestamp": self._last_read_timestamp,
            "buffer_size": len(self._buffer),
            "hardware_validated": False,  # Physical testing pending
            "pipeline_stages": [
                {"stage": 1, "name": "Atmospheric Pressure Fluctuations", "status": "ambient_input"},
                {"stage": 2, "name": "Microbarometer Sensing Assembly", "status": "hardware_pending"},
                {"stage": 3, "name": "Sensor Interface / Signal Conditioning", "status": "hardware_pending"},
                {"stage": 4, "name": "Digitizer or DAQ", "status": "hardware_pending"},
                {"stage": 5, "name": "Acquisition Service", "status": "software_ready"},
                {"stage": 6, "name": "InfraSocket Data Pipeline", "status": "software_ready"},
                {"stage": 7, "name": "Live Waveform & Signal Analysis", "status": "software_ready"},
            ],
        }


# Singleton hardware manager instance
hardware_manager = HardwareAcquisitionManager()

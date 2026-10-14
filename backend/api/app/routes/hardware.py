"""Hardware integration and sensor interface endpoints.

Allows querying hardware connection state, hardware device information,
pipeline stages, and attempting connection without fabricating results.
"""

from typing import Any, Dict, List
from fastapi import APIRouter
from pydantic import BaseModel

from acquisition.hardware import (
    ConnectionStatus,
    HardwareInterfaceType,
    hardware_manager,
)

router = APIRouter(prefix="/hardware", tags=["hardware"])


class HardwareConnectRequest(BaseModel):
    interface_type: str = "serial_stream"
    device_id: str = "default"
    port_or_address: str = "AUTO"
    sample_rate: float = 40.0


@router.get("/status")
async def get_hardware_status() -> Dict[str, Any]:
    """Get the current microbarometer hardware interface status.
    
    Reports honest connection state, target frequency range (0.01 - 20 Hz),
    and whether physical hardware characterization is validated.
    """
    return hardware_manager.get_status()


@router.get("/adapters")
async def get_supported_adapters() -> List[Dict[str, Any]]:
    """List available hardware acquisition adapters and interface architectures."""
    return [
        {
            "id": "direct_serial",
            "name": "Microbarometer Serial / Virtual COM Streamer",
            "interface_type": HardwareInterfaceType.SERIAL_STREAM.value,
            "description": "RS-232, RS-422, or USB-UART interface streaming digitized acoustic pressure packets.",
            "target_frequency_range_hz": [0.01, 20.0],
            "recommended_baud": 115200,
            "status": "ready_for_driver",
        },
        {
            "id": "network_digitizer",
            "name": "Ethernet / SeedLink TCP Digitizer",
            "interface_type": HardwareInterfaceType.ETHERNET_TCP.value,
            "description": "Geophysical digitizer (e.g. Centaur, Guralp, Reftek) delivering continuous packetized infrasound data.",
            "target_frequency_range_hz": [0.01, 20.0],
            "default_port": 18000,
            "status": "ready_for_driver",
        },
        {
            "id": "analog_daq",
            "name": "Multi-Channel DAQ / ADC Board",
            "interface_type": HardwareInterfaceType.ANALOG_DAQ.value,
            "description": "Precision 24-bit delta-sigma ADC sampling differential transducer voltage (0-5V / ±10V).",
            "target_frequency_range_hz": [0.01, 20.0],
            "adc_bits": 24,
            "status": "ready_for_driver",
        },
        {
            "id": "direct_digital_i2c_spi",
            "name": "Direct Digital Sensor (I2C / SPI on Single-Board Computer)",
            "interface_type": HardwareInterfaceType.DIRECT_DIGITAL.value,
            "description": "Direct bus connection for sensors with integrated ADC/transducer stages.",
            "target_frequency_range_hz": [0.01, 20.0],
            "status": "ready_for_driver",
        },
    ]


@router.post("/connect")
async def connect_hardware(req: HardwareConnectRequest) -> Dict[str, Any]:
    """Attempt connection to physical microbarometer.
    
    If no physical hardware is plugged into the system, reports clean
    disconnected status rather than simulating a fake hardware connection.
    """
    success = hardware_manager.connect()
    status = hardware_manager.get_status()
    return {
        "success": success,
        "connected": status["is_connected"],
        "connection_state": status["connection_state"],
        "message": status["status_message"],
        "target_frequency_range_hz": status["target_frequency_range_hz"],
    }


@router.post("/disconnect")
async def disconnect_hardware() -> Dict[str, Any]:
    """Disconnect active microbarometer interface."""
    hardware_manager.disconnect()
    return {
        "success": True,
        "connected": False,
        "connection_state": ConnectionStatus.DISCONNECTED.value,
        "message": "Live sensor interface disconnected. Standby mode active.",
    }

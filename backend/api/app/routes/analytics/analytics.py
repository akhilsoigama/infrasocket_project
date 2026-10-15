"""Analytics summary endpoint."""

from fastapi import APIRouter

from ...database.repositories.events import EventRepository
from ...database.repositories.stations import StationRepository
from ...schemas import AnalyticsSummaryResponse
from ...services.demo_service import demo_service

router = APIRouter(prefix="/analytics", tags=["analytics"])


@router.get("/summary", response_model=AnalyticsSummaryResponse)
async def get_analytics_summary():
    """Get analytics summary."""
    stations = StationRepository.get_stations()
    active_stations = sum(1 for s in stations if s.get("is_online", False))

    event_counts = EventRepository.count_events()
    memory_events = len(demo_service.events_in_memory)

    return AnalyticsSummaryResponse(
        active_stations=active_stations,
        events_today=event_counts["total"] + memory_events,
        anomalies_detected=event_counts["anomalies"]
        + sum(1 for e in demo_service.events_in_memory if e.get("is_anomaly")),
        data_points_processed=demo_service.status["data_points"],
        stream_status=demo_service.status,
        ai_stats=demo_service.inference_engine.stats,
    )

import os
import csv
import math
from typing import Dict, Any, List, Optional
from fastapi import HTTPException
from pydantic import BaseModel
import logging

logger = logging.getLogger("InfraSocket")

DATASET_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../../../Dataset"))
if not os.path.exists(DATASET_DIR):
    DATASET_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../../../dataset"))

IMA_FILE = os.path.join(DATASET_DIR, "IMA_array_infrasound_waveform_v1.csv")
IMA_MSEED = os.path.join(DATASET_DIR, "IMA_array_infrasound_waveform_v1.mseed")
ENCR1_FILE = os.path.join(DATASET_DIR, "fdsnws-dataselect_2026-10-03t05_11_02z.csv")
ENCR1_MSEED = os.path.join(DATASET_DIR, "fdsnws-dataselect_2026-10-03t05_11_02z.mseed")

def filter_infrasound(values: List[float], fs: float, lowcut: float = 0.01, highcut: float = 5.0) -> List[float]:
    if not values or len(values) < 30:
        return values
    try:
        from signal_processing.filters import bandpass_filter
        filtered = bandpass_filter(values, lowcut, highcut, fs)
        return filtered.tolist()
    except Exception as e:
        logger.error(f"Filtering failed: {e}")
        return values

def detect_anomalies_zscore(values: List[float], threshold: float = 3.0) -> List[int]:
    if not values:
        return []
    mean = sum(values) / len(values)
    variance = sum((x - mean) ** 2 for x in values) / len(values)
    std = math.sqrt(variance)
    if std == 0:
        return []
    
    anomalies = []
    for i, val in enumerate(values):
        if abs(val - mean) / std > threshold:
            anomalies.append(i)
    return anomalies

@router.get("/dataset/{dataset_name}")
async def get_dataset(dataset_name: str) -> Dict[str, Any]:
    if dataset_name == "IMA":
        headers = []
        data = []
        values_ima1 = []
        
        if os.path.exists(IMA_FILE):
            with open(IMA_FILE, 'r') as f:
                reader = csv.reader(f)
                headers = next(reader)
                for row in reader:
                    if not row: continue
                    parsed = [float(x) for x in row]
                    data.append(parsed)
                    values_ima1.append(parsed[1])
        elif os.path.exists(IMA_MSEED):
            import obspy
            st = obspy.read(IMA_MSEED)
            headers = ["Time"] + [tr.stats.channel for tr in st]
            fs = st[0].stats.sampling_rate
            min_len = min(len(tr.data) for tr in st)
            for i in range(min_len):
                t_sec = round(i / fs, 4)
                row = [t_sec] + [float(tr.data[i]) for tr in st]
                data.append(row)
                values_ima1.append(float(st[0].data[i]))
        else:
            raise HTTPException(status_code=404, detail="IMA dataset not found")
                
        filtered_values = filter_infrasound(values_ima1, fs=40.0, lowcut=0.01, highcut=5.0)
        anomalies = detect_anomalies_zscore(filtered_values, threshold=3.5)
        
        return {
            "dataset": "IMA",
            "headers": headers,
            "data": data,
            "filtered_infrasound": filtered_values,
            "anomalies": anomalies
        }
        
    elif dataset_name == "ENCR1":
        data = []
        values = []
        
        if os.path.exists(ENCR1_FILE):
            with open(ENCR1_FILE, 'r') as f:
                reader = csv.reader(f)
                headers = next(reader)
                count = 0
                for row in reader:
                    if not row or len(row) < 8: continue
                    if count % 5 == 0:
                        val = float(row[7])
                        data.append({
                            "time": row[0],
                            "sample_rate": float(row[5]),
                            "value": val
                        })
                        values.append(val)
                    count += 1
        elif os.path.exists(ENCR1_MSEED):
            import obspy
            st = obspy.read(ENCR1_MSEED)
            tr = st[0]
            raw_data = tr.data.tolist()
            subset = raw_data[::5]  # Decimate 100 Hz by 5 to 20 Hz
            fs = tr.stats.sampling_rate / 5.0
            for i, val in enumerate(subset[:4000]):
                data.append({
                    "time": str(tr.stats.starttime + i / fs),
                    "sample_rate": fs,
                    "value": float(val)
                })
                values.append(float(val))
        else:
            raise HTTPException(status_code=404, detail="ENCR1 dataset not found")
                
        filtered_values = filter_infrasound(values, fs=20.0, lowcut=0.01, highcut=5.0)
        anomalies = detect_anomalies_zscore(filtered_values, threshold=4.0)
        
        return {
            "dataset": "ENCR1",
            "data": data,
            "filtered_infrasound": filtered_values,
            "anomalies": anomalies
        }
        
    elif dataset_name == "ENCR_ARRAY":
        import obspy
        import glob
        
        encr_dir = os.path.join(DATASET_DIR, "ENCR_array")
        if not os.path.exists(encr_dir):
            raise HTTPException(status_code=404, detail="ENCR_array dataset not found")
        
        files = glob.glob(os.path.join(encr_dir, "**", "5O.*"), recursive=True)
        if not files:
            raise HTTPException(status_code=404, detail="No MiniSEED files in ENCR_array")
            
        file_path = files[0]
        try:
            st = obspy.read(file_path)
            tr = st[0]
            
            # Take a 20,000 sample slice and decimate by 5 (4000 points) to avoid large payloads
            raw_data = tr.data[:20000].tolist()
            subset = raw_data[::5]
            fs = tr.stats.sampling_rate / 5.0
            
            data = []
            for i, val in enumerate(subset):
                data.append({
                    "time": str(tr.stats.starttime + i/fs),
                    "sample_rate": fs,
                    "value": float(val)
                })
                
            filtered_values = filter_infrasound(subset, fs=fs, lowcut=0.01, highcut=5.0)
            anomalies = detect_anomalies_zscore(filtered_values, threshold=4.0)
            
            return {
                "dataset": "ENCR_ARRAY",
                "data": data,
                "filtered_infrasound": filtered_values,
                "anomalies": anomalies
            }
        except Exception as e:
            logger.error(f"Failed to read ENCR_array file: {e}")
            raise HTTPException(status_code=500, detail=str(e))
            
    else:
        if dataset_name in USER_IMPORTED_DATASETS:
            return USER_IMPORTED_DATASETS[dataset_name]
        raise HTTPException(status_code=404, detail="Dataset unknown")

USER_IMPORTED_DATASETS: Dict[str, Any] = {}

class ImportDatasetRequest(BaseModel):
    name: str
    sample_rate: float = 40.0
    values: List[float]
    units: str = "Pa"
    category: str = "custom"
    description: Optional[str] = "User-imported infrasound time series"

@router.get("/datasets")
async def list_datasets() -> List[Dict[str, Any]]:
    """List all available recorded infrasound datasets and catalogs."""
    base_catalog = [
        {
            "id": "IMA",
            "name": "IMA Beirut Array (Explosion Transient)",
            "category": "explosion",
            "source": "IMA 4-element Infrasound Array, Beirut",
            "sample_rate_hz": 40.0,
            "target_band_hz": [0.01, 20.0],
            "units": "Pascal (Pa)",
            "channels": ["IMA1", "IMA2", "IMA3", "IMA4"],
            "description": "High-yield blast wave and atmospheric shock front recording with microbarom harmonics.",
        },
        {
            "id": "ENCR1",
            "name": "ENCR1 Station (Mount Etna Volcanic Infrasound)",
            "category": "volcano",
            "source": "INGV Infrasound Network, Sicily",
            "sample_rate_hz": 20.0,
            "target_band_hz": [0.01, 10.0],
            "units": "Acoustic Pressure (Pa, Calibrated)",
            "channels": ["HDF"],
            "description": "Low-frequency volcanic tremor and strombolian explosive degassing acoustic signals.",
        },
        {
            "id": "ENCR_ARRAY",
            "name": "ENCR Multi-Station Array (Volcanic Infrasound)",
            "category": "volcano",
            "source": "ENCR Infrasound Array (MiniSEED Archive)",
            "sample_rate_hz": 20.0,
            "target_band_hz": [0.01, 10.0],
            "units": "Acoustic Pressure (Pa, Calibrated)",
            "channels": ["ENCR1", "ENCR2", "ENCR3", "ENCR4", "ENCR5", "ENCR6"],
            "description": "Spatial array geometry recordings for phase arrival and back-azimuth verification.",
        },
    ]

    for k, v in USER_IMPORTED_DATASETS.items():
        base_catalog.append({
            "id": k,
            "name": v.get("name", k),
            "category": v.get("category", "custom"),
            "source": "User Imported Dataset",
            "sample_rate_hz": v.get("sample_rate", 40.0),
            "target_band_hz": [0.01, min(20.0, v.get("sample_rate", 40.0) / 2.0)],
            "units": v.get("units", "Pa"),
            "channels": ["CH1"],
            "description": v.get("description", "User-imported dataset"),
        })

    return base_catalog

@router.post("/dataset/import")
async def import_user_dataset(req: ImportDatasetRequest) -> Dict[str, Any]:
    """Import a user-provided infrasound recording for visualization and DSP analysis."""
    if not req.values:
        raise HTTPException(status_code=400, detail="Values array cannot be empty")
    
    clean_values = [float(x) for x in req.values if not math.isnan(x) and not math.isinf(x)]
    if len(clean_values) < 10:
        raise HTTPException(status_code=400, detail="At least 10 valid numerical samples required")
    
    dataset_id = f"USER_{len(USER_IMPORTED_DATASETS) + 1}_{req.name.replace(' ', '_')}"
    filtered = filter_infrasound(clean_values, fs=req.sample_rate, lowcut=0.01, highcut=min(5.0, req.sample_rate / 2.5))
    anomalies = detect_anomalies_zscore(filtered, threshold=3.5)

    data_payload = []
    for i, val in enumerate(clean_values):
        data_payload.append({
            "time": f"{i / req.sample_rate:.3f}",
            "sample_rate": req.sample_rate,
            "value": val,
        })

    result = {
        "dataset": dataset_id,
        "name": req.name,
        "category": req.category,
        "sample_rate": req.sample_rate,
        "units": req.units,
        "data": data_payload,
        "filtered_infrasound": filtered,
        "anomalies": anomalies,
        "description": req.description,
    }

    USER_IMPORTED_DATASETS[dataset_id] = result
    return {"status": "SUCCESS", "dataset_id": dataset_id, "sample_count": len(clean_values)}

class ValidationRequest(BaseModel):
    dataset_path: str = DATASET_DIR

@router.post("/dataset/validate")
async def run_validation(req: ValidationRequest) -> Dict[str, Any]:
    import sys
    import os
    # Ensure the workspace root is in sys.path to import 'backend' package
    root_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../.."))
    if root_dir not in sys.path:
        sys.path.append(root_dir)
        
    from backend.acquisition.validate import validate_miniseed_directory
    
    try:
        result = await validate_miniseed_directory(req.dataset_path)
        return result
    except Exception as e:
        logger.error(f"Validation failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


"""Analytics summary endpoint."""

from fastapi import APIRouter

from ..database.repositories.events import EventRepository
from ..database.repositories.stations import StationRepository
from ..schemas import AnalyticsSummaryResponse
from ..services.demo_service import demo_service

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
from typing import Dict, Any, List
from fastapi import HTTPException
from pydantic import BaseModel
import logging

logger = logging.getLogger("InfraSocket")

DATASET_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../../dataset"))
IMA_FILE = os.path.join(DATASET_DIR, "IMA_array_infrasound_waveform_v1.csv")
ENCR1_FILE = os.path.join(DATASET_DIR, "fdsnws-dataselect_2026-10-03t05_11_02z.csv")

def filter_infrasound(values: List[float], fs: float, lowcut: float = 0.01, highcut: float = 5.0) -> List[float]:
    if not values or len(values) < 30:
        return values
    try:
        from ...signal_processing.filters import bandpass_filter
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
        if not os.path.exists(IMA_FILE):
            raise HTTPException(status_code=404, detail="IMA dataset not found")
        
        headers = []
        data = []
        values_ima1 = []
        with open(IMA_FILE, 'r') as f:
            reader = csv.reader(f)
            headers = next(reader)
            for row in reader:
                if not row: continue
                parsed = [float(x) for x in row]
                data.append(parsed)
                values_ima1.append(parsed[1])
                
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
        if not os.path.exists(ENCR1_FILE):
            raise HTTPException(status_code=404, detail="ENCR1 dataset not found")
        
        data = []
        values = []
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
                
        filtered_values = filter_infrasound(values, fs=20.0, lowcut=0.01, highcut=5.0)
        anomalies = detect_anomalies_zscore(filtered_values, threshold=4.0)
        
        return {
            "dataset": "ENCR1",
            "data": data,
            "filtered_infrasound": filtered_values,
            "anomalies": anomalies
        }
        
    else:
        raise HTTPException(status_code=404, detail="Dataset unknown")

class ValidationRequest(BaseModel):
    dataset_path: str = DATASET_DIR

@router.post("/dataset/validate")
async def run_validation(req: ValidationRequest) -> Dict[str, Any]:
    from ....acquisition.validate import validate_miniseed_directory
    try:
        result = await validate_miniseed_directory(req.dataset_path)
        return result
    except Exception as e:
        logger.error(f"Validation failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

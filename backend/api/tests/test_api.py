"""Tests for FastAPI health endpoint."""

import pytest
from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_root():
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "InfraSocket API"


def test_health():
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert "status" in data
    assert "version" in data
    assert data["version"] == "1.0.0"


def test_get_stations():
    response = client.get("/api/stations")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) > 0


def test_get_events():
    response = client.get("/api/events")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)


def test_demo_status():
    response = client.get("/api/demo/status")
    assert response.status_code == 200
    data = response.json()
    assert "running" in data
    assert "source" in data


def test_hardware_status():
    response = client.get("/api/hardware/status")
    assert response.status_code == 200
    data = response.json()
    assert "is_connected" in data
    assert "target_frequency_range_hz" in data
    assert data["target_frequency_range_hz"]["min"] == 0.01
    assert data["target_frequency_range_hz"]["max"] == 20.0
    assert data["is_connected"] is False  # Honest: no physical hardware connected
    assert "Live sensor not connected" in data["status_message"]


def test_calibration_benchmarks():
    response = client.get("/api/calibration/benchmarks")
    assert response.status_code == 200
    data = response.json()
    assert "tests" in data
    assert len(data["tests"]) >= 4
    # Ensure physical validation status is marked pending
    assert any(t["status"] == "pending_validation" for t in data["tests"])


def test_datasets_catalog():
    response = client.get("/api/analytics/datasets")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) >= 3
    dataset_ids = [d["id"] for d in data]
    assert "IMA" in dataset_ids
    assert "ENCR1" in dataset_ids


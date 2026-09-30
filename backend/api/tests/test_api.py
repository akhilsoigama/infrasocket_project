"""Tests for FastAPI health endpoint."""

import pytest
from fastapi.testclient import TestClient

from ..app.main import app

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

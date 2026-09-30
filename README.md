# InfraSocket

AI-Powered Infrasound Monitoring & Anomaly Detection System

This is a complete monorepo for a scientific monitoring desktop application demonstrating:
- Atmospheric/Infrasound Data Acquisition (Demo generation)
- Signal Processing (Filtering, FFT, Spectrograms, Feature Extraction)
- AI Anomaly Detection (Scikit-Learn Isolation Forest)
- Backend (FastAPI, WebSockets, PostgreSQL/SQLAlchemy)
- Frontend (Electron, React, TypeScript, Tailwind, shadcn/ui, Plotly)

## Project Structure

- `backend/`: Python backend engine
  - `acquisition/`: Data ingestion and generation
  - `signal_processing/`: DSP algorithms (FFT, filtering)
  - `ai/`: Anomaly detection and classification models
  - `api/`: FastAPI REST and WebSocket server
- `desktop/`: Electron + React desktop frontend

## Quick Start (Demo Mode)

### 1. Start the Backend (Using Docker)

The easiest way to run the backend and the PostgreSQL database is using Docker Compose.

Make sure Docker Desktop is running, then execute:

```powershell
docker-compose up --build
```

*Alternatively, to run manually without Docker:*
```powershell
cd backend/api
python -m venv venv
.\venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

*Note: The system runs in "memory-only demo mode" if PostgreSQL is not available.*

### 2. Start the Desktop App

```powershell
cd desktop
npm install
npm run dev:electron
```

## Architecture

- **Backend**: FastAPI serves REST endpoints and real-time WebSocket streams (`ws://localhost:8000/ws/live`). A `demo_service.py` orchestrates data generation, signal processing, and AI inference in the background.
- **Frontend**: Vite builds the React application, which is then loaded into an Electron `BrowserWindow`. Real-time data is handled by a custom `WebSocketClient` and `Zustand` stores. Plotly is used for performant waveform rendering.
"# infrasocket_project" 

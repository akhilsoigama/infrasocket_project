FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies from api directory
COPY api/requirements.txt ./api/
RUN pip install --no-cache-dir -r api/requirements.txt

# Copy all backend modules (acquisition, signal_processing, ai, api)
COPY . .

# Expose FastAPI port
EXPOSE 8000

# Run the application (using the api directory as the module root)
WORKDIR /app/api
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]

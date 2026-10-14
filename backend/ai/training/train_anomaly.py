"""Script for training the Isolation Forest anomaly detector on real infrasound datasets."""

import csv
import os
import sys
from pathlib import Path

# Automatically ensure workspace root is on sys.path
WORKSPACE_ROOT = Path(__file__).resolve().parents[3]
if str(WORKSPACE_ROOT) not in sys.path:
    sys.path.insert(0, str(WORKSPACE_ROOT))

import numpy as np
from backend.ai.anomaly import AnomalyDetector
from backend.signal_processing.features import extract_features, features_to_vector


def train_on_real_data(dataset_rel_path: str = "dataset/IMA_array_infrasound_waveform_v1.csv"):
    dataset_file = WORKSPACE_ROOT / dataset_rel_path
    if not dataset_file.exists():
        print(f"File {dataset_file} not found.")
        return None

    print(f"Loading data from {dataset_file}...")

    values = []
    with open(dataset_file, "r", encoding="utf-8") as f:
        reader = csv.reader(f)
        next(reader)  # skip headers
        for row in reader:
            if not row:
                continue
            values.append(float(row[1]))  # IMA1

    print(f"Loaded {len(values)} samples.")

    # Chunking data
    window_size = 256
    sample_rate = 40.0  # IMA sample rate

    feature_vectors = []
    for i in range(0, len(values) - window_size, window_size):
        chunk = np.array(values[i : i + window_size], dtype=np.float64)
        feats = extract_features(chunk, sample_rate)
        vec = features_to_vector(feats)
        feature_vectors.append(vec)

    print(f"Extracted {len(feature_vectors)} feature vectors.")

    detector = AnomalyDetector(contamination=0.05)
    detector.fit(feature_vectors)

    print("Anomaly detector trained successfully.")
    print("Stats:", detector.stats)
    return detector


if __name__ == "__main__":
    train_on_real_data()

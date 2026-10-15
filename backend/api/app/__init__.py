"""App package."""

import os
import sys

# Ensure backend directory and project root are in sys.path
backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "../.."))
project_root = os.path.abspath(os.path.join(backend_dir, ".."))
for path in (backend_dir, project_root):
    if path not in sys.path:
        sys.path.insert(0, path)

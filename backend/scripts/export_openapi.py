"""Write the FastAPI OpenAPI contract to backend/openapi.yaml.

Usage (from the repo root): backend/venv/bin/python backend/scripts/export_openapi.py
Then regenerate frontend types: npm run api:types
"""

import sys
from pathlib import Path

import yaml

BACKEND = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(BACKEND))

from main import app  # noqa: E402

(BACKEND / "openapi.yaml").write_text(yaml.safe_dump(app.openapi(), sort_keys=False, allow_unicode=True))

import unittest
from pathlib import Path


class BackendContainerTests(unittest.TestCase):
    def test_backend_image_exposes_app_package_to_alembic(self):
        dockerfile = (Path(__file__).resolve().parents[2] / "backend" / "Dockerfile").read_text(encoding="utf-8")
        self.assertIn("PYTHONPATH=/app", dockerfile)


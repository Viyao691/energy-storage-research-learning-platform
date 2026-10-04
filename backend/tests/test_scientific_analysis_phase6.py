from __future__ import annotations

import io
import zipfile
from pathlib import Path

import pytest
from fastapi.testclient import TestClient


@pytest.fixture()
def client(tmp_path: Path, monkeypatch: pytest.MonkeyPatch):
    monkeypatch.setenv("DATABASE_URL", f"sqlite:///{tmp_path / 'scientific.db'}")
    monkeypatch.setenv("PAPER_STORAGE_PATH", str(tmp_path / "papers"))
    monkeypatch.setenv("MODEL_PROVIDER", "mock")
    from app.main import create_app

    with TestClient(create_app()) as api:
        yield api


def _paper(client: TestClient) -> int:
    from app.models import Paper

    with client.app.state.session_factory() as db:
        paper = Paper(title="science", file_size=1, page_count=1, extracted_text="private full text")
        db.add(paper)
        db.commit()
        db.refresh(paper)
        return paper.id


def test_fixed_recipe_registry_known_answers_and_refusal_conditions() -> None:
    from app.scientific_analysis import RecipeInputError, get_recipe

    retention = get_recipe("electrochem.cycle_retention").run(
        {"cycle": [1, 2, 3], "capacity": [100, 95, 90]}, {}, {}
    )
    assert retention["retention_percent"] == pytest.approx(90.0)
    efficiency = get_recipe("electrochem.coulombic_efficiency").run(
        {"charge_capacity": [100, 100], "discharge_capacity": [90, 95]}, {}, {}
    )
    assert efficiency["mean_efficiency_percent"] == pytest.approx(92.5)
    xrd = get_recipe("materials.xrd_bragg").run(
        {"two_theta_deg": [30.0]}, {}, {"wavelength_nm": 0.15406}
    )
    assert xrd["d_spacing_nm"][0] == pytest.approx(0.2976, rel=1e-3)
    microscopy = get_recipe("materials.microscopy_size").run(
        {"diameter_px": [10, 20]}, {}, {"scale_nm_per_px": 2}
    )
    assert microscopy["diameter_nm"] == [20.0, 40.0]
    with pytest.raises(RecipeInputError):
        get_recipe("materials.microscopy_size").run({"diameter_px": [10]}, {}, {})
    with pytest.raises(KeyError):
        get_recipe("arbitrary.user.script")


def test_dataset_confidence_confirmation_analysis_staleness_and_export(client: TestClient) -> None:
    paper_id = _paper(client)
    created = client.post(
        f"/api/v1/papers/{paper_id}/scientific-datasets",
        json={
            "source_type": "local_table",
            "domain": "electrochemistry",
            "dataset_type": "cycling",
            "data": {"cycle": [1, 2, 3], "capacity": [100, 95, 90]},
            "units": {"capacity": "mAh g-1"},
            "parameters": {
                "row_column_complete": True,
                "unit_complete": True,
                "cells_complete": True,
            },
            "confidence": 0.96,
        },
    )
    assert created.status_code == 201
    dataset = created.json()
    assert dataset["confirmation_status"] == "confirmed"

    analysis = client.post(
        f"/api/v1/scientific-datasets/{dataset['id']}/analyses",
        json={"recipe": "electrochem.cycle_retention", "parameters": {}},
    )
    assert analysis.status_code == 201
    assert analysis.json()["results"]["retention_percent"] == pytest.approx(90.0)

    export = client.get(f"/api/v1/scientific-analyses/{analysis.json()['id']}/export")
    assert export.status_code == 200
    with zipfile.ZipFile(io.BytesIO(export.content)) as archive:
        assert {"data.csv", "method.json", "plot.png", "plot.svg", "report.md", "rerun.py"}.issubset(archive.namelist())
        combined = b"".join(archive.read(name) for name in archive.namelist())
        assert b"private full text" not in combined
        assert b"API_KEY" not in combined

    edited = client.patch(
        f"/api/v1/scientific-datasets/{dataset['id']}",
        json={"data": {"cycle": [1, 2, 3], "capacity": [100, 90, 80]}, "confirmed": True},
    )
    assert edited.status_code == 200
    assert edited.json()["revision_count"] == 1
    assert client.get(f"/api/v1/scientific-analyses/{analysis.json()['id']}").json()["is_stale"] is True


def test_cloud_and_low_confidence_curve_must_be_confirmed_before_calculation(client: TestClient) -> None:
    paper_id = _paper(client)
    for source_type, parameters in (
        ("cloud_vision", {"axis_complete": True, "calibration_residual": 0.001, "unobstructed": True, "series_matched": True}),
        ("local_curve", {"axis_complete": True, "calibration_residual": 0.02, "unobstructed": True, "series_matched": True}),
    ):
        created = client.post(
            f"/api/v1/papers/{paper_id}/scientific-datasets",
            json={
                "source_type": source_type,
                "domain": "generic",
                "dataset_type": "curve",
                "data": {"x": [1, 2], "y": [3, 4]},
                "units": {"x": "s", "y": "A"},
                "parameters": parameters,
                "confidence": 0.95,
            },
        )
        assert created.json()["confirmation_status"] == "pending"
        refused = client.post(
            f"/api/v1/scientific-datasets/{created.json()['id']}/analyses",
            json={"recipe": "generic.table_statistics", "parameters": {}},
        )
        assert refused.status_code == 409


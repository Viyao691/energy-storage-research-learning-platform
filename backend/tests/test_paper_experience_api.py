from __future__ import annotations

import io
from pathlib import Path

import fitz
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import func, select


@pytest.fixture()
def client(tmp_path: Path, monkeypatch: pytest.MonkeyPatch):
    monkeypatch.setenv("DATABASE_URL", f"sqlite:///{tmp_path / 'experience.db'}")
    monkeypatch.setenv("PAPER_STORAGE_PATH", str(tmp_path / "papers"))
    monkeypatch.setenv("MODEL_PROVIDER", "mock")
    monkeypatch.delenv("MODEL_API_KEY", raising=False)

    from app.main import create_app

    app = create_app()
    with TestClient(app) as api:
        yield api


def _pdf_bytes(text: str = "P2 layered oxide") -> bytes:
    document = fitz.open()
    page = document.new_page()
    page.insert_text((72, 72), text)
    result = document.tobytes()
    document.close()
    return result


def _visual_pdf_bytes() -> bytes:
    document = fitz.open()
    try:
        first_page = document.new_page()
        first_page.insert_text(
            (72, 72),
            "Figure 1. Crystal structure of the P2 cathode.",
        )
        second_page = document.new_page()
        second_page.insert_text(
            (72, 72),
            "Table 2. Electrochemical testing conditions.",
        )
        return document.tobytes()
    finally:
        document.close()


def _analysis_pdf_bytes() -> bytes:
    document = fitz.open()
    try:
        for text in (
            "Title and Abstract: sodium layered oxide cathode.",
            "Methods and Experimental: controlled humidity exposure.",
            "Results and Discussion. Figure 2 shows phase evolution.",
            "Conclusion: the proposed treatment improves stability.",
        ):
            page = document.new_page()
            page.insert_text((72, 72), text)
        return document.tobytes()
    finally:
        document.close()


def _upload(client: TestClient, filename: str = "待删除论文.pdf") -> dict[str, object]:
    response = client.post(
        "/api/v1/papers/upload",
        files={
            "file": (
                filename,
                io.BytesIO(_pdf_bytes()),
                "application/pdf",
            )
        },
    )
    assert response.status_code == 201
    return response.json()


def test_failed_report_keeps_previous_content_and_records_failed_task(
    client: TestClient, monkeypatch: pytest.MonkeyPatch,
) -> None:
    from app.models import Analysis, TaskRun
    from app.providers import ModelProviderError
    import app.routers.papers as papers_routes

    paper_id = int(_upload(client, "failed-report.pdf")["id"])
    with client.app.state.session_factory() as db:
        db.add(Analysis(paper_id=paper_id, summary="", plain_explanation="", deep_analysis="",
                        quick_understanding="原有有效报告", quick_prompt_version="quick-understanding-v4",
                        quick_schema_version="quick-understanding-schema-v2", quick_evidence_status="原有证据",
                        evidence_status="原有证据", provider="mock", model_name="mock"))
        db.commit()

    class FailingProvider:
        name = "fake"

        def analyze_report(self, *args, **kwargs):
            raise ModelProviderError("模型返回不符合当前报告格式，原报告保持不变")

    monkeypatch.setattr(papers_routes, "make_provider", lambda *args, **kwargs: FailingProvider())
    response = client.post(f"/api/v1/papers/{paper_id}/analysis/quick_understanding")
    assert response.status_code == 502
    assert "原报告保持不变" in response.json()["detail"]
    detail = client.get(f"/api/v1/papers/{paper_id}").json()["analysis"]
    assert detail["quick_understanding"] == "原有有效报告"
    with client.app.state.session_factory() as db:
        task = db.scalar(select(TaskRun).where(TaskRun.resource_id == paper_id))
        assert task is not None and task.status == "failed"
        assert task.error_code == "MODEL_ANALYSIS_FAILED"


def test_glossary_mock_generation_and_followup_without_index(client: TestClient) -> None:
    paper_id = int(_upload(client, "glossary.pdf")["id"])
    generated = client.post(f"/api/v1/papers/{paper_id}/glossary/generate")
    assert generated.status_code == 200
    result = generated.json()
    assert 15 <= len(result["terms"]) <= 20
    assert all(len(item["explanation"]) <= 80 for item in result["terms"])
    assert result["evidence_status"] == "AI推断（Mock 演示）"
    asked = client.post(f"/api/v1/papers/{paper_id}/glossary/ask", json={
        "question": "容量是什么？", "history": [{"question": "能量密度是什么？", "answer": "通用概念。"}],
    })
    assert asked.status_code == 200
    assert asked.json()["question"] == "容量是什么？"
    assert len(asked.json()["answer"]) <= 150
    assert asked.json()["evidence_status"] == "AI推断（Mock 演示）"


def test_legacy_aggregate_analyze_endpoint_is_disabled(
    client: TestClient,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    from app.models import Analysis, Paper
    from app.providers import AnalysisReportResult
    import app.routers.papers as main_module

    uploaded = client.post(
        "/api/v1/papers/upload",
        files={"file": ("analysis.pdf", io.BytesIO(_analysis_pdf_bytes()), "application/pdf")},
    ).json()
    paper_id = int(uploaded["id"])
    with client.app.state.session_factory() as db:
        paper = db.get(Paper, paper_id)
        assert paper is not None
        paper.article_type = "研究论文"
        paper.parse_confidence = 0.88
        db.add(
            Analysis(
                paper_id=paper_id,
                summary="旧总结",
                plain_explanation="旧通俗解释",
                deep_analysis="旧深度分析",
                evidence_status="旧状态",
                provider="mock",
                model_name="mock",
            )
        )
        db.commit()

    captured: dict[str, object] = {}

    class FakeProvider:
        name = "fake"

        def analyze_report(
            self,
            title: str,
            text: str,
            report_type,
            *,
            article_type: str = "",
            evidence_scope: str = "",
        ) -> ModelResult:
            captured.update(
                title=title,
                text=text,
                article_type=article_type,
                evidence_scope=evidence_scope,
            )
            return ModelResult("新总结", "新通俗解释", "新深度分析", "AI归纳（测试）")

    monkeypatch.setattr(main_module, "make_provider", lambda *args, **kwargs: FakeProvider())
    response = client.post(f"/api/v1/papers/{paper_id}/analyze")

    assert response.status_code == 410
    assert "旧版聚合解析入口已停用" in response.json()["detail"]
    assert captured == {}


def test_independent_reviewer_report_generation_preserves_other_two_reports(
    client: TestClient,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    from app.models import Analysis, Paper
    from app.providers import AnalysisReportResult
    import app.routers.papers as main_module

    uploaded = client.post(
        "/api/v1/papers/upload",
        files={"file": ("decoupling.pdf", io.BytesIO(_analysis_pdf_bytes()), "application/pdf")},
    ).json()
    paper_id = int(uploaded["id"])
    with client.app.state.session_factory() as db:
        paper = db.get(Paper, paper_id)
        assert paper is not None
        paper.title = "Decoupling slab gliding and lattice contraction in Na layered oxides"
        paper.article_type = "研究论文"
        db.add(Analysis(
            paper_id=paper_id,
            summary="旧版总报告快速段",
            plain_explanation="旧版总报告教学段",
            deep_analysis="旧版总报告审稿段",
            quick_understanding="完整快速报告",
            quick_prompt_version="quick-understanding-v4",
            quick_schema_version="quick-understanding-schema-v2",
            quick_evidence_status="快速证据状态",
            layman_understanding="完整教学报告",
            layman_prompt_version="layman-understanding-v4",
            layman_schema_version="layman-understanding-schema-v2",
            layman_evidence_status="教学证据状态",
            reviewer_analysis="旧审稿报告",
            reviewer_prompt_version="reviewer-analysis-v4",
            reviewer_schema_version="reviewer-analysis-schema-v2",
            reviewer_evidence_status="审稿证据状态",
            evidence_status="旧状态",
            provider="mock",
            model_name="mock",
        ))
        db.commit()

    observed: dict[str, object] = {}

    class IndependentProvider:
        name = "fake"

        def analyze_report(self, title, text, report_type, *, article_type="", evidence_scope=""):
            observed.update(title=title, text=text, report_type=report_type)
            return AnalysisReportResult("## 新审稿人报告\n\n结尾完整。", "AI归纳（测试）")

    monkeypatch.setattr(main_module, "make_provider", lambda *args, **kwargs: IndependentProvider())
    response = client.post(f"/api/v1/papers/{paper_id}/analysis/reviewer_analysis")

    assert response.status_code == 200
    assert response.json()["report_type"] == "reviewer_analysis"
    assert response.json()["reviewer_analysis"].endswith("结尾完整。")
    assert response.json()["prompt_version"] == "reviewer-analysis-v6"
    assert str(observed["report_type"]) in {"reviewer_analysis", "AnalysisReportType.reviewer_analysis"}
    detail = client.get(f"/api/v1/papers/{paper_id}").json()["analysis"]
    assert detail["quick_understanding"] == "完整快速报告"
    assert detail["layman_understanding"] == "完整教学报告"
    assert detail["reviewer_analysis"] == "## 新审稿人报告\n\n结尾完整。"
    assert detail["quick_prompt_version"] == "quick-understanding-v4"
    assert detail["reviewer_schema_version"] == "reviewer-analysis-schema-v2"


def test_legacy_analysis_without_current_versions_is_not_returned_as_new_reports(
    client: TestClient,
) -> None:
    from app.models import Analysis

    uploaded = _upload(client, "legacy-analysis.pdf")
    paper_id = int(uploaded["id"])
    with client.app.state.session_factory() as db:
        db.add(Analysis(
            paper_id=paper_id,
            summary="旧快速段",
            plain_explanation="旧教学段",
            deep_analysis="旧审稿段",
            evidence_status="旧状态",
            provider="deepseek",
            model_name="legacy-model",
        ))
        db.commit()

    detail = client.get(f"/api/v1/papers/{paper_id}").json()["analysis"]
    assert detail["quick_understanding"] == ""
    assert detail["layman_understanding"] == ""
    assert detail["reviewer_analysis"] == ""
    assert "旧快速段" not in str(detail)


def test_analyze_abstract_only_paper_declares_scope_without_page_markers(
    client: TestClient,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    from app.models import Paper
    from app.providers import AnalysisReportResult
    import app.routers.papers as main_module

    uploaded = _upload(client, "abstract-only.pdf")
    paper_id = int(uploaded["id"])
    with client.app.state.session_factory() as db:
        paper = db.get(Paper, paper_id)
        assert paper is not None
        paper.file_path = ""
        paper.extracted_text = ""
        paper.abstract = "The abstract reports a capacity improvement."
        paper.acquisition_status = "abstract"
        paper.article_type = "综述"
        db.commit()

    captured: dict[str, object] = {}

    class FakeProvider:
        name = "fake"

        def analyze_report(
            self,
            title: str,
            text: str,
            report_type: object,
            *,
            article_type: str = "",
            evidence_scope: str = "",
        ) -> AnalysisReportResult:
            captured.update(text=text, article_type=article_type, evidence_scope=evidence_scope)
            return AnalysisReportResult("summary", "AI归纳（测试）")

    monkeypatch.setattr(main_module, "make_provider", lambda *args, **kwargs: FakeProvider())
    response = client.post(f"/api/v1/papers/{paper_id}/analysis/quick_understanding")

    assert response.status_code == 200
    assert captured["article_type"] == "综述"
    assert captured["evidence_scope"] == "仅摘要"
    assert "【证据范围：仅摘要】" in str(captured["text"])
    assert "【第 " not in str(captured["text"])


def test_delete_paper_removes_related_records_and_unreferenced_managed_file(
    client: TestClient,
) -> None:
    from app.models import Analysis, Note, Paper, PaperSourceRecord, PaperVisual

    uploaded = _upload(client)
    paper_id = int(uploaded["id"])

    with client.app.state.session_factory() as db:
        paper = db.get(Paper, paper_id)
        assert paper is not None
        stored_path = Path(paper.file_path or "")
        db.add(
            Analysis(
                paper_id=paper_id,
                summary="summary",
                plain_explanation="plain",
                deep_analysis="deep",
                evidence_status="AI推断（Mock 演示）",
                provider="mock",
                model_name="mock",
            )
        )
        db.add(Note(paper_id=paper_id, content="private note"))
        db.add(
            PaperSourceRecord(
                paper_id=paper_id,
                source="openalex",
                external_id="W-delete-test",
            )
        )
        db.add(
            PaperVisual(
                paper_id=paper_id,
                page_number=1,
                kind="figure",
                label="Figure 1",
                caption="Figure 1. Test visual.",
            )
        )
        db.commit()

    response = client.request(
        "DELETE",
        f"/api/v1/papers/{paper_id}",
        json={"confirmation_title": uploaded["title"]},
    )

    assert response.status_code == 200
    assert response.json() == {
        "deleted": True,
        "paper_id": paper_id,
        "file_deleted": True,
        "warning": None,
    }
    assert stored_path.exists() is False
    assert client.get(f"/api/v1/papers/{paper_id}").status_code == 404
    with client.app.state.session_factory() as db:
        assert db.get(Paper, paper_id) is None
        assert (
            db.scalar(
                select(func.count())
                .select_from(Analysis)
                .where(Analysis.paper_id == paper_id)
            )
            == 0
        )
        assert (
            db.scalar(
                select(func.count())
                .select_from(PaperVisual)
                .where(PaperVisual.paper_id == paper_id)
            )
            == 0
        )
        assert (
            db.scalar(
                select(func.count())
                .select_from(Note)
                .where(Note.paper_id == paper_id)
            )
            == 0
        )
        assert (
            db.scalar(
                select(func.count())
                .select_from(PaperSourceRecord)
                .where(PaperSourceRecord.paper_id == paper_id)
            )
            == 0
        )


def test_delete_paper_keeps_a_file_still_referenced_by_another_paper(
    client: TestClient,
) -> None:
    from app.models import Paper

    uploaded = _upload(client, "共享文件.pdf")
    paper_id = int(uploaded["id"])

    with client.app.state.session_factory() as db:
        paper = db.get(Paper, paper_id)
        assert paper is not None
        stored_path = Path(paper.file_path or "")
        db.add(
            Paper(
                title="共享文件的另一条记录",
                file_path=str(stored_path),
                file_hash=None,
                file_size=paper.file_size,
                page_count=paper.page_count,
                extracted_text=paper.extracted_text,
                parse_confidence=paper.parse_confidence,
            )
        )
        db.commit()

    response = client.request(
        "DELETE",
        f"/api/v1/papers/{paper_id}",
        json={"confirmation_title": uploaded["title"]},
    )

    assert response.status_code == 200
    assert response.json()["warning"] is None
    assert response.json()["file_deleted"] is False
    assert stored_path.exists() is True


def test_file_reference_check_recognizes_same_hash_at_a_different_path(
    client: TestClient,
) -> None:
    from app.routers._shared import _paper_file_is_still_referenced
    from app.models import Paper

    shared_hash = "a" * 64
    with client.app.state.session_factory() as db:
        db.add(
            Paper(
                title="相同哈希的另一条记录",
                file_path="/managed/different-copy.pdf",
                file_hash=shared_hash,
                file_size=10,
                page_count=1,
                extracted_text="same content",
                parse_confidence=1.0,
            )
        )
        db.commit()

        assert _paper_file_is_still_referenced(
            db,
            file_path="/managed/original.pdf",
            file_hash=shared_hash,
        )


def test_delete_missing_paper_returns_404(client: TestClient) -> None:
    response = client.request(
        "DELETE",
        "/api/v1/papers/999999",
        json={"confirmation_title": "不存在的论文"},
    )

    assert response.status_code == 404
    assert "论文" in response.json()["detail"]


def test_delete_rejects_a_mismatched_confirmation_title(
    client: TestClient,
) -> None:
    uploaded = _upload(client, "必须确认标题.pdf")

    response = client.request(
        "DELETE",
        f"/api/v1/papers/{uploaded['id']}",
        json={"confirmation_title": "错误标题"},
    )

    assert response.status_code == 409
    assert client.get(f"/api/v1/papers/{uploaded['id']}").status_code == 200


def test_delete_paper_never_removes_a_file_outside_managed_storage(
    client: TestClient,
    tmp_path: Path,
) -> None:
    from app.models import Paper

    uploaded = _upload(client, "外部文件记录.pdf")
    paper_id = int(uploaded["id"])
    outside_file = tmp_path / "outside-paper.pdf"
    outside_file.write_bytes(_pdf_bytes("outside managed storage"))
    with client.app.state.session_factory() as db:
        paper = db.get(Paper, paper_id)
        assert paper is not None
        paper.file_path = str(outside_file)
        db.commit()

    response = client.request(
        "DELETE",
        f"/api/v1/papers/{paper_id}",
        json={"confirmation_title": uploaded["title"]},
    )

    assert response.status_code == 200
    assert response.json()["warning"] == (
        "数据库记录已删除，但关联文件不在受管存储目录内，未执行文件清理。"
    )
    assert response.json()["file_deleted"] is False
    assert str(outside_file) not in response.text
    assert outside_file.exists() is True


def test_file_cleanup_failure_is_sanitized_and_does_not_restore_database_record(
    client: TestClient,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    from app.models import Paper

    uploaded = _upload(client, "私密路径论文.pdf")
    paper_id = int(uploaded["id"])
    with client.app.state.session_factory() as db:
        paper = db.get(Paper, paper_id)
        assert paper is not None
        stored_path = Path(paper.file_path or "").resolve()

    original_unlink = Path.unlink

    def failing_unlink(path: Path, *args: object, **kwargs: object) -> None:
        if path.resolve() == stored_path:
            raise OSError(f"private path leaked: {path}")
        original_unlink(path, *args, **kwargs)

    monkeypatch.setattr(Path, "unlink", failing_unlink)

    response = client.request(
        "DELETE",
        f"/api/v1/papers/{paper_id}",
        json={"confirmation_title": uploaded["title"]},
    )

    assert response.status_code == 200
    body = response.json()
    assert body["deleted"] is True
    assert body["paper_id"] == paper_id
    assert body["file_deleted"] is False
    assert body["warning"] == "数据库记录已删除，但本地 PDF 文件清理失败。"
    assert str(stored_path) not in response.text
    assert "private path leaked" not in response.text
    assert client.get(f"/api/v1/papers/{paper_id}").status_code == 404


def test_managed_pdf_file_visual_catalog_and_page_preview_are_available(
    client: TestClient,
) -> None:
    response = client.post(
        "/api/v1/papers/upload",
        files={
            "file": (
                "visual-paper.pdf",
                io.BytesIO(_visual_pdf_bytes()),
                "application/pdf",
            )
        },
    )
    assert response.status_code == 201
    paper_id = int(response.json()["id"])

    # Simulate a pre-0004 paper so the visual route must build the catalog lazily.
    from app.models import PaperVisual

    with client.app.state.session_factory() as db:
        db.query(PaperVisual).filter(PaperVisual.paper_id == paper_id).delete()
        db.commit()

    file_response = client.get(f"/api/v1/papers/{paper_id}/file")
    assert file_response.status_code == 200
    assert file_response.headers["content-type"].startswith("application/pdf")
    assert file_response.content.startswith(b"%PDF-")
    assert "visual-paper.pdf" not in file_response.headers.get(
        "content-disposition",
        "",
    )

    visuals_response = client.get(f"/api/v1/papers/{paper_id}/visuals")
    assert visuals_response.status_code == 200
    visuals = visuals_response.json()
    assert [
        (item["page_number"], item["kind"], item["label"])
        for item in visuals
    ] == [
        (1, "figure", "Figure 1"),
        (2, "table", "Table 2"),
    ]
    assert all("file_path" not in item for item in visuals)

    # The second call reuses the stored catalog instead of creating duplicates.
    second_visuals = client.get(f"/api/v1/papers/{paper_id}/visuals")
    assert second_visuals.json() == visuals

    image_response = client.get(f"/api/v1/papers/{paper_id}/pages/2/image")
    assert image_response.status_code == 200
    assert image_response.headers["content-type"] == "image/png"
    assert image_response.content.startswith(b"\x89PNG\r\n\x1a\n")


def test_saved_visual_crop_is_bounded_rendered_and_analyzed_on_demand(
    client: TestClient,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    from app.providers import VisualModelResult
    import app.routers.papers as main_module

    uploaded = client.post(
        "/api/v1/papers/upload",
        files={
            "file": (
                "crop-paper.pdf",
                io.BytesIO(_visual_pdf_bytes()),
                "application/pdf",
            )
        },
    ).json()
    paper_id = int(uploaded["id"])
    visual_id = client.get(f"/api/v1/papers/{paper_id}/visuals").json()[0]["id"]

    invalid = client.post(
        f"/api/v1/papers/{paper_id}/visuals/{visual_id}/crops",
        json={"left": 0.8, "top": 0.2, "width": 0.3, "height": 0.4},
    )
    created = client.post(
        f"/api/v1/papers/{paper_id}/visuals/{visual_id}/crops",
        json={"left": 0.1, "top": 0.1, "width": 0.5, "height": 0.4, "label": "循环曲线"},
    )

    assert invalid.status_code == 422
    assert created.status_code == 201
    crop_id = created.json()["id"]
    listed = client.get(f"/api/v1/papers/{paper_id}/visuals/{visual_id}/crops")
    image = client.get(f"/api/v1/crops/{crop_id}/image")
    assert listed.status_code == 200
    assert listed.json()[0]["label"] == "循环曲线"
    assert image.status_code == 200
    assert image.content.startswith(b"\x89PNG\r\n\x1a\n")

    observed: dict[str, bytes] = {}

    class CapturingProvider:
        name = "capture"
        supports_vision = True

        def analyze_visual(self, _title, _caption, _page_text, png_bytes):
            observed["png"] = png_bytes
            return VisualModelResult(
                "## 裁切分析\n\n仅分析保存的区域。",
                "AI推断（测试）",
                "capture-vision",
            )

    monkeypatch.setattr(
        main_module,
        "make_provider",
        lambda *_args, **_kwargs: CapturingProvider(),
    )
    analyzed = client.post(f"/api/v1/crops/{crop_id}/analyze")
    deleted = client.delete(
        f"/api/v1/papers/{paper_id}/visuals/{visual_id}/crops/{crop_id}"
    )

    assert analyzed.status_code == 200
    assert analyzed.json()["analysis_markdown"] == "## 裁切分析\n\n仅分析保存的区域。"
    assert analyzed.json()["provider"] == "capture"
    assert observed["png"] == image.content
    assert deleted.status_code == 204
    assert client.get(f"/api/v1/crops/{crop_id}/image").status_code == 404


def test_saved_crop_extracts_structured_data_from_crop_image_only(
    client: TestClient,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    from app.providers import VisualStructuredDataResult
    import app.routers.papers as main_module

    uploaded = client.post(
        "/api/v1/papers/upload",
        files={
            "file": (
                "structured-crop.pdf",
                io.BytesIO(_visual_pdf_bytes()),
                "application/pdf",
            )
        },
    ).json()
    paper_id = int(uploaded["id"])
    visual_id = client.get(f"/api/v1/papers/{paper_id}/visuals").json()[0]["id"]
    crop = client.post(
        f"/api/v1/papers/{paper_id}/visuals/{visual_id}/crops",
        json={"left": 0.1, "top": 0.1, "width": 0.5, "height": 0.4},
    ).json()
    crop_image = client.get(f"/api/v1/crops/{crop['id']}/image").content
    observed: dict[str, bytes] = {}

    class CapturingProvider:
        name = "capture"
        supports_vision = True

        def extract_visual_data(self, _title, _caption, _page_text, png_bytes):
            observed["png"] = png_bytes
            return VisualStructuredDataResult(
                chart_type="line",
                x_axis={"label": "Cycle", "unit": ""},
                y_axis={"label": "Capacity", "unit": "mAh g^-1"},
                series=[{"name": "P2", "points": [{"x": "1", "y": "120"}]}],
                limitations=["示例提取结果，需要人工核对。"],
                evidence_status="AI推断（测试）",
                model_name="capture-vision",
            )

    monkeypatch.setattr(main_module, "make_provider", lambda *_args, **_kwargs: CapturingProvider())
    response = client.post(f"/api/v1/crops/{crop['id']}/extract-data")

    assert response.status_code == 200
    assert response.json()["structured_data"]["chart_type"] == "line"
    assert response.json()["structured_data"]["series"][0]["points"][0]["y"] == "120"
    assert response.json()["evidence_status"] == "AI推断（测试）"
    assert observed["png"] == crop_image


def test_mock_visual_analysis_is_saved_with_explicit_evidence_status(
    client: TestClient,
) -> None:
    uploaded = client.post(
        "/api/v1/papers/upload",
        files={
            "file": (
                "visual-analysis.pdf",
                io.BytesIO(_visual_pdf_bytes()),
                "application/pdf",
            )
        },
    ).json()
    visuals = client.get(
        f"/api/v1/papers/{uploaded['id']}/visuals"
    ).json()
    visual_id = visuals[0]["id"]

    response = client.post(
        f"/api/v1/papers/{uploaded['id']}/visuals/{visual_id}/analyze"
    )

    assert response.status_code == 200
    result = response.json()
    assert result["analysis_markdown"]
    assert result["evidence_status"] == "AI推断（Mock 图像演示）"
    assert result["provider"] == "mock"
    stored = client.get(
        f"/api/v1/papers/{uploaded['id']}/visuals"
    ).json()
    assert stored[0]["analysis_markdown"] == result["analysis_markdown"]


def test_visual_analysis_saves_actual_vision_model_and_keeps_last_success(
    client: TestClient,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    from app.providers import (
        ModelProviderError,
        VisualModelResult,
    )
    import app.routers.papers as main_module

    observed: dict[str, str] = {}

    uploaded = client.post(
        "/api/v1/papers/upload",
        files={
            "file": (
                "ollama-visual.pdf",
                io.BytesIO(_visual_pdf_bytes()),
                "application/pdf",
            )
        },
    ).json()
    visual_id = client.get(
        f"/api/v1/papers/{uploaded['id']}/visuals"
    ).json()[0]["id"]

    class WorkingVisionProvider:
        name = "ollama"
        supports_vision = True

        def analyze_visual(
            self,
            title: str,
            caption: str,
            page_text: str,
            png_bytes: bytes,
        ) -> VisualModelResult:
            observed["context"] = page_text
            return VisualModelResult(
                analysis_markdown="## 本地视觉结论\n\n结果需人工核验。",
                evidence_status="AI归纳（Ollama 本地图像分析，待原文与图表人工核验）",
                model_name="qwen2.5vl:3b",
            )

    monkeypatch.setattr(
        main_module,
        "make_provider",
        lambda *args, **kwargs: WorkingVisionProvider(),
    )
    monkeypatch.setattr(
        main_module,
        "extract_page_texts",
        lambda _path: [
            (
                "Figure 1. Crystal structure of the P2 cathode.\n"
                "As shown in Figure 1a, the slabs adopt the refined stacking."
            ),
            "The comparison in Fig. 1b is used to discuss the alternative structure.",
        ],
    )
    success = client.post(
        f"/api/v1/papers/{uploaded['id']}/visuals/{visual_id}/analyze"
    )

    assert success.status_code == 200
    assert success.json()["model_name"] == "qwen2.5vl:3b"
    assert "图号：Figure 1" in observed["context"]
    assert "Caption：Figure 1. Crystal structure of the P2 cathode." in observed["context"]
    assert "PDF 页码：1" in observed["context"]
    assert "PDF 第 1 页" in observed["context"]
    assert "PDF 第 2 页" in observed["context"]

    class FailingVisionProvider(WorkingVisionProvider):
        def analyze_visual(
            self,
            title: str,
            caption: str,
            page_text: str,
            png_bytes: bytes,
        ) -> VisualModelResult:
            raise ModelProviderError("Ollama 图像分析超时")

    monkeypatch.setattr(
        main_module,
        "make_provider",
        lambda *args, **kwargs: FailingVisionProvider(),
    )
    failed = client.post(
        f"/api/v1/papers/{uploaded['id']}/visuals/{visual_id}/analyze"
    )
    stored = client.get(
        f"/api/v1/papers/{uploaded['id']}/visuals"
    ).json()[0]

    assert failed.status_code == 502
    assert stored["analysis_markdown"] == "## 本地视觉结论\n\n结果需人工核验。"
    assert stored["model_name"] == "qwen2.5vl:3b"


def test_ollama_without_a_vision_model_gets_configuration_guidance(
    client: TestClient,
) -> None:
    uploaded = client.post(
        "/api/v1/papers/upload",
        files={
            "file": (
                "ollama-no-vision.pdf",
                io.BytesIO(_visual_pdf_bytes()),
                "application/pdf",
            )
        },
    ).json()
    visual_id = client.get(
        f"/api/v1/papers/{uploaded['id']}/visuals"
    ).json()[0]["id"]
    configured = client.post(
        "/api/v1/settings",
        json={
            "model_provider": "ollama",
            "model_name": "qwen2.5:7b",
            "vision_model": "",
            "model_base_url": "http://host.docker.internal:11434",
        },
    )
    assert configured.status_code == 200

    response = client.post(
        f"/api/v1/papers/{uploaded['id']}/visuals/{visual_id}/analyze"
    )

    assert response.status_code == 409
    assert "尚未配置 Ollama 视觉模型" in response.json()["detail"]
    assert "系统设置" in response.json()["detail"]


def test_visual_analysis_rejects_wrong_paper_and_nonvision_provider(
    client: TestClient,
) -> None:
    first = client.post(
        "/api/v1/papers/upload",
        files={
            "file": (
                "first-visual.pdf",
                io.BytesIO(_visual_pdf_bytes()),
                "application/pdf",
            )
        },
    ).json()
    second_pdf = _visual_pdf_bytes() + b"\n% distinct"
    second = client.post(
        "/api/v1/papers/upload",
        files={
            "file": (
                "second-visual.pdf",
                io.BytesIO(second_pdf),
                "application/pdf",
            )
        },
    ).json()
    visual_id = client.get(
        f"/api/v1/papers/{first['id']}/visuals"
    ).json()[0]["id"]

    wrong_paper = client.post(
        f"/api/v1/papers/{second['id']}/visuals/{visual_id}/analyze"
    )
    assert wrong_paper.status_code == 404

    configured = client.post(
        "/api/v1/settings",
        json={
            "model_provider": "deepseek",
            "model_name": "deepseek-v4-flash",
            "model_base_url": "https://api.deepseek.com",
            "api_key": "deepseek-test-key",
        },
    )
    assert configured.status_code == 200
    unsupported = client.post(
        f"/api/v1/papers/{first['id']}/visuals/{visual_id}/analyze"
    )
    assert unsupported.status_code == 409
    assert "不支持图像分析" in unsupported.json()["detail"]


@pytest.mark.parametrize("page_number", [0, 3])
def test_page_preview_returns_404_for_invalid_page(
    client: TestClient,
    page_number: int,
) -> None:
    response = client.post(
        "/api/v1/papers/upload",
        files={
            "file": (
                "two-pages.pdf",
                io.BytesIO(_visual_pdf_bytes()),
                "application/pdf",
            )
        },
    )
    paper_id = int(response.json()["id"])

    preview = client.get(
        f"/api/v1/papers/{paper_id}/pages/{page_number}/image"
    )

    assert preview.status_code == 404
    assert "页码" in preview.json()["detail"]


def test_pdf_routes_reject_metadata_only_and_outside_storage_records(
    client: TestClient,
    tmp_path: Path,
) -> None:
    from app.models import Paper

    with client.app.state.session_factory() as db:
        metadata_only = Paper(
            title="Metadata only",
            file_size=0,
            acquisition_status="metadata_only",
            fulltext_status="仅元数据或摘要",
        )
        db.add(metadata_only)
        db.commit()
        db.refresh(metadata_only)
        metadata_id = metadata_only.id

    for suffix in ("file", "visuals", "pages/1/image"):
        response = client.get(f"/api/v1/papers/{metadata_id}/{suffix}")
        assert response.status_code == 404
        assert str(tmp_path) not in response.text

    uploaded = _upload(client, "outside-path.pdf")
    outside = tmp_path / "outside.pdf"
    outside.write_bytes(_visual_pdf_bytes())
    with client.app.state.session_factory() as db:
        paper = db.get(Paper, int(uploaded["id"]))
        assert paper is not None
        paper.file_path = str(outside)
        db.commit()

    for suffix in ("file", "visuals", "pages/1/image"):
        response = client.get(f"/api/v1/papers/{uploaded['id']}/{suffix}")
        assert response.status_code == 404
        assert str(outside) not in response.text


def test_glossary_persistence_cache_force_and_failed_force(client, monkeypatch):
    from app.routers import papers
    from app.providers import ModelProviderError
    original = papers.make_provider
    calls = []
    fail = False
    def provider(*args):
        instance = original(*args)
        generate = instance.generate_structured_task
        def tracked(*args, **kwargs):
            calls.append(1)
            if fail:
                raise ModelProviderError("controlled failure")
            return generate(*args, **kwargs)
        instance.generate_structured_task = tracked
        return instance
    monkeypatch.setattr(papers, "make_provider", provider)
    paper_id = _upload(client, "persist-glossary.pdf")["id"]
    url = f"/api/v1/papers/{paper_id}/glossary"
    assert client.get(url).json() is None
    first = client.post(url + "/generate")
    assert first.status_code == 200
    assert client.get(url).json() == first.json()
    assert client.post(url + "/generate").json() == first.json()
    assert len(calls) == 1
    assert client.post(url + "/generate?regenerate=true").status_code == 200
    assert len(calls) == 2
    old = client.get(url).json()
    fail = True
    assert client.post(url + "/generate?regenerate=true").status_code == 502
    assert client.get(url).json() == old
    assert len(calls) == 3


def test_glossary_restore_without_model_or_overwrite(client, monkeypatch):
    from app.routers import papers
    def forbidden(*args):
        raise AssertionError("restore must not create a provider")
    monkeypatch.setattr(papers, "make_provider", forbidden)
    paper_id = _upload(client, "restore-glossary.pdf")["id"]
    url = f"/api/v1/papers/{paper_id}/glossary"
    old = {"terms": [{"term": "XRD", "explanation": "Saved older list"}], "provider": "mock", "model_name": "old", "evidence_status": "saved"}
    assert client.post(url, json=old).json() == old
    assert client.get(url).json() == old
    replacement = dict(old, model_name="replacement")
    assert client.post(url, json=replacement).json() == old
    assert client.get(url).json() == old

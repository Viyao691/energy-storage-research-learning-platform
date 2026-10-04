from __future__ import annotations

import json
import os
import threading
import base64
import hashlib
from datetime import datetime
from pathlib import Path
from typing import Any

import fitz
import httpx
from sqlalchemy import delete, func, select, update

from app.providers import provider_base_url
from app.document_parsers import (
    DoclingDocumentParser,
    DocumentParser,
    ParseCancelled,
    docling_capability,
)
from app.models import Analysis, Paper, PaperPageExtraction, PaperParseRun, ScientificDataset


MODEL_ID = "PP-StructureV3"
MODEL_VERSION = "paddleocr-3.7.0"


def assess_native_page(text: str, blocks: list[object]) -> dict[str, object]:
    cleaned = " ".join(text.split())
    replacement_ratio = (cleaned.count("�") / max(len(cleaned), 1))
    control_ratio = sum(ord(char) < 32 and char not in "\n\t\r" for char in text) / max(len(text), 1)
    needs_ocr = len(cleaned) < 40 or replacement_ratio > 0.02 or control_ratio > 0.01
    confidence = 0.2 if not cleaned else max(0.05, min(0.99, 0.98 - replacement_ratio * 4 - control_ratio * 4))
    return {
        "needs_ocr": needs_ocr,
        "confidence": confidence if not needs_ocr else min(confidence, 0.45),
        "characters": len(cleaned),
        "block_count": len(blocks),
    }


def _native_blocks(page: fitz.Page) -> list[dict[str, object]]:
    result: list[dict[str, object]] = []
    for item in page.get_text("blocks"):
        if len(item) >= 5 and str(item[4]).strip():
            result.append({"bbox": [float(value) for value in item[:4]], "text": str(item[4]).strip()})
    return result


def _json(value: object) -> str:
    return json.dumps(value, ensure_ascii=False)


class DocumentAIManager:
    """Owns the single local document-AI runtime and its model cache."""

    def __init__(self, model_dir: Path) -> None:
        self.model_dir = model_dir
        self._lock = threading.Lock()
        self._install_status = "installed" if self._marker_path().exists() else "not_installed"
        self._install_error = ""
        self.install_call_count = 0
        self.current_task: dict[str, Any] | None = None
        self._job_lock = threading.Lock()
        self._ocr_engine: Any | None = None
        self._candidate_parser: DocumentParser | None = None
        self._candidate_parser_version = ""

    def _marker_path(self) -> Path:
        return self.model_dir / "model-manifest.json"

    @staticmethod
    def capabilities() -> dict[str, object]:
        gpu = False
        try:
            import paddle

            gpu = bool(paddle.device.is_compiled_with_cuda() and paddle.device.cuda.device_count() > 0)
        except (ImportError, RuntimeError):
            pass
        return {"cpu": True, "gpu": gpu, "preferred_device": "gpu" if gpu else "cpu"}

    def status(self) -> dict[str, object]:
        marker: dict[str, object] = {}
        try:
            marker = json.loads(self._marker_path().read_text(encoding="utf-8"))
        except (FileNotFoundError, OSError, json.JSONDecodeError):
            pass
        return {
            "local_model": {
                "id": MODEL_ID,
                "version": MODEL_VERSION,
                "installed": self._marker_path().exists(),
                "status": self._install_status,
                "download_size_mb": marker.get("download_size_mb", 0),
                "error": self._install_error or None,
            },
            "capabilities": self.capabilities(),
            "current_task": self.current_task,
        }

    def set_candidate_parser(self, parser: DocumentParser, *, version: str) -> None:
        self._candidate_parser = parser
        self._candidate_parser_version = version

    def parser_status(self) -> dict[str, object]:
        if self._candidate_parser is not None:
            return {
                "installed": True,
                "artifacts_available": True,
                "ready": True,
                "version": self._candidate_parser_version,
                "reason": "",
            }
        return docling_capability(self.model_dir / "docling")

    def _parser(self) -> DocumentParser:
        if self._candidate_parser is not None:
            return self._candidate_parser
        capability = self.parser_status()
        if not capability["ready"]:
            raise RuntimeError(str(capability["reason"]))
        return DoclingDocumentParser(artifacts_path=self.model_dir / "docling")

    def run_candidate(self, session_factory, run_id: int) -> None:
        if not self._job_lock.acquire(blocking=False):
            self._finish_candidate(
                session_factory, run_id, "failed", "已有文档解析任务正在运行。"
            )
            return
        try:
            with session_factory() as db:
                run = db.get(PaperParseRun, run_id)
                if run is None or run.status != "queued":
                    return
                paper = db.get(Paper, run.paper_id)
                if paper is None or not paper.file_path:
                    raise RuntimeError("论文原文件不存在。")
                run.status = "running"
                run.started_at = datetime.utcnow()
                run.device = "local"
                self.current_task = {
                    "type": "docling_candidate",
                    "id": run.id,
                    "paper_id": run.paper_id,
                    "progress": 0.0,
                }
                db.commit()

                def is_cancelled() -> bool:
                    db.refresh(run)
                    return bool(run.cancel_requested)

                parsed = self._parser().parse(
                    Path(paper.file_path).resolve(), is_cancelled=is_cancelled
                )
                if is_cancelled():
                    raise ParseCancelled()
                for page in parsed.pages:
                    layout = [
                        {
                            "element_id": element.element_id,
                            "text": element.text,
                            "label": element.label,
                            "bbox": {
                                "left": element.left,
                                "top": element.top,
                                "right": element.right,
                                "bottom": element.bottom,
                            },
                            "coord_origin": "TOPLEFT",
                        }
                        for element in page.elements
                    ]
                    tables = [
                        element for element in layout
                        if str(element["label"]).lower() == "table"
                    ]
                    formulas = [
                        element for element in layout
                        if str(element["label"]).lower() in {"formula", "equation"}
                    ]
                    figures = [
                        element for element in layout
                        if str(element["label"]).lower() in {"figure", "picture", "image"}
                    ]
                    db.add(
                        PaperPageExtraction(
                            parse_run_id=run.id,
                            paper_id=paper.id,
                            page_number=page.page_number,
                            source_type="docling",
                            text=page.text,
                            layout_json=_json(layout),
                            tables_json=_json(tables),
                            formulas_json=_json(formulas),
                            figures_json=_json(figures),
                            coordinates_json=_json(
                                [element["bbox"] for element in layout]
                            ),
                            page_width=page.width,
                            page_height=page.height,
                            confidence=1.0 if page.text.strip() else 0.0,
                            confirmation_status="candidate",
                        )
                    )
                run.progress = 1.0
                run.quality_score = sum(
                    1.0 for page in parsed.pages if page.text.strip()
                ) / max(len(parsed.pages), 1)
                run.warnings_json = _json(list(parsed.warnings))
                run.status = "completed"
                run.completed_at = datetime.utcnow()
                db.commit()
        except ParseCancelled:
            self._finish_candidate(session_factory, run_id, "cancelled", "任务已取消。")
        except Exception as exc:
            self._finish_candidate(session_factory, run_id, "failed", str(exc))
        finally:
            self.current_task = None
            self._job_lock.release()

    @staticmethod
    def _finish_candidate(session_factory, run_id: int, status: str, message: str) -> None:
        with session_factory() as db:
            db.execute(
                delete(PaperPageExtraction).where(
                    PaperPageExtraction.parse_run_id == run_id
                )
            )
            run = db.get(PaperParseRun, run_id)
            if run is not None:
                run.status = status
                run.error_message = message
                run.completed_at = datetime.utcnow()
            db.commit()

    def install_models(self) -> None:
        self.install_call_count += 1
        if not self._lock.acquire(blocking=False):
            return
        try:
            self._install_status = "installing"
            self._install_error = ""
            self.model_dir.mkdir(parents=True, exist_ok=True)
            try:
                from paddleocr import PPStructureV3

                PPStructureV3(device="cpu")
            except ImportError as exc:
                raise RuntimeError("本地 PP-StructureV3 运行组件尚未安装。") from exc
            files = [path for path in self.model_dir.rglob("*") if path.is_file() and path != self._marker_path()]
            digest = hashlib.sha256()
            total_size = 0
            for path in sorted(files):
                total_size += path.stat().st_size
                digest.update(path.relative_to(self.model_dir).as_posix().encode())
                digest.update(hashlib.sha256(path.read_bytes()).digest())
            self._marker_path().write_text(
                json.dumps(
                    {
                        "model_id": MODEL_ID,
                        "version": MODEL_VERSION,
                        "download_size_mb": round(total_size / 1024 / 1024, 1),
                        "source": "PaddleOCR official model hub",
                        "cache_checksum_sha256": digest.hexdigest(),
                    },
                    ensure_ascii=False,
                ),
                encoding="utf-8",
            )
            self._install_status = "installed"
        except Exception as exc:
            self._install_status = "failed"
            self._install_error = str(exc)
        finally:
            self._lock.release()

    def ocr_page(self, png_bytes: bytes, page_number: int) -> dict[str, object]:
        if not self._marker_path().exists():
            raise RuntimeError("请先在设置页确认下载 PP-StructureV3 模型。")
        if self._ocr_engine is None:
            from paddleocr import PPStructureV3

            device = str(self.capabilities()["preferred_device"])
            try:
                # enable_mkldnn=False works around a paddlepaddle 3.3 CPU bug
                # (ConvertPirAttribute2RuntimeAttribute: oneDNN PIR attribute
                # conversion not implemented) that crashes CPU inference on
                # PP-StructureV3. See PaddlePaddle/Paddle#77340.
                self._ocr_engine = PPStructureV3(device=device, enable_mkldnn=False)
            except Exception:
                self._ocr_engine = PPStructureV3(device="cpu", enable_mkldnn=False)
        temporary = self.model_dir / f"page-{page_number}-{threading.get_ident()}.png"
        try:
            temporary.write_bytes(png_bytes)
            predictions = list(self._ocr_engine.predict(input=str(temporary)))
            raw: dict[str, object] = {}
            if predictions:
                candidate = getattr(predictions[0], "json", predictions[0])
                if callable(candidate):
                    candidate = candidate()
                if isinstance(candidate, dict):
                    raw = candidate.get("res", candidate) if isinstance(candidate.get("res", candidate), dict) else candidate
            blocks = raw.get("parsing_res_list", raw.get("layout", []))
            text_parts: list[str] = []
            normalized_blocks: list[dict[str, object]] = []
            if isinstance(blocks, list):
                for block in blocks:
                    if not isinstance(block, dict):
                        continue
                    content = str(block.get("block_content", block.get("text", ""))).strip()
                    bbox = block.get("block_bbox", block.get("bbox", []))
                    if content:
                        text_parts.append(content)
                        normalized_blocks.append({"text": content, "bbox": bbox})
            return {
                "text": "\n".join(text_parts),
                "confidence": float(raw.get("confidence", 0.85)),
                "blocks": normalized_blocks,
                "tables": raw.get("table_res_list", []),
                "formulas": raw.get("formula_res_list", []),
                "figures": raw.get("seal_res_list", []),
            }
        finally:
            temporary.unlink(missing_ok=True)

    def cloud_enhance(
        self,
        *,
        page_png: bytes,
        page_number: int,
        local_text: str,
        caption_context: str,
        provider: str = "mock",
        model: str = "",
        base_url: str = "",
        timeout_seconds: int = 90,
        api_key: str = "",
    ) -> dict[str, object]:
        if provider == "mock":
            return {
                "text": f"第 {page_number} 页云端视觉增强 Mock 预览",
                "confidence": 0.7,
                "layout": [],
            }
        resolved_url = provider_base_url(provider, base_url)
        if provider == "openai-compatible":
            resolved_url = base_url.strip().rstrip("/")
        if not api_key or not resolved_url or not model:
            raise RuntimeError("文档视觉供应商尚未完整配置。")
        encoded = base64.b64encode(page_png).decode("ascii")
        prompt = (
            "仅识别这一页科研论文，恢复阅读顺序、表格、公式和图注。"
            f"\n本地文字：{local_text[:4000]}\n必要图注：{caption_context[:1000]}"
        )
        if provider == "anthropic":
            response = httpx.post(
                f"{resolved_url}/messages",
                headers={"x-api-key": api_key, "anthropic-version": "2023-06-01", "content-type": "application/json"},
                json={
                    "model": model,
                    "max_tokens": 4096,
                    "messages": [{"role": "user", "content": [
                        {"type": "text", "text": prompt},
                        {"type": "image", "source": {"type": "base64", "media_type": "image/png", "data": encoded}},
                    ]}],
                },
                timeout=timeout_seconds,
                follow_redirects=False,
            )
        else:
            response = httpx.post(
                f"{resolved_url}/chat/completions",
                headers={"Authorization": f"Bearer {api_key}"},
                json={
                    "model": model,
                    "messages": [{"role": "user", "content": [
                        {"type": "text", "text": prompt},
                        {"type": "image_url", "image_url": {"url": f"data:image/png;base64,{encoded}"}},
                    ]}],
                },
                timeout=timeout_seconds,
                follow_redirects=False,
            )
        response.raise_for_status()
        payload = response.json()
        if provider == "anthropic":
            text = "\n".join(part["text"] for part in payload.get("content", []) if isinstance(part, dict) and part.get("type") == "text" and isinstance(part.get("text"), str))
        else:
            text = str(payload["choices"][0]["message"]["content"])
        if not text.strip():
            raise RuntimeError("文档视觉模型未返回可用内容。")
        return {"text": text, "confidence": 0.0, "layout": []}

    def run_ocr(self, session_factory, run_id: int) -> None:
        if not self._job_lock.acquire(blocking=False):
            with session_factory() as db:
                run = db.get(PaperParseRun, run_id)
                if run:
                    run.status = "failed"
                    run.error_message = "已有文档解析任务正在运行。"
                    run.completed_at = datetime.utcnow()
                    db.commit()
            return
        temporary_path: Path | None = None
        try:
            with session_factory() as db:
                run = db.get(PaperParseRun, run_id)
                if run is None:
                    return
                paper = db.get(Paper, run.paper_id)
                if paper is None or not paper.file_path:
                    raise RuntimeError("论文原文件不存在。")
                run.status = "running"
                run.started_at = datetime.utcnow()
                run.device = str(self.capabilities()["preferred_device"])
                self.current_task = {"type": "ocr", "id": run.id, "paper_id": run.paper_id, "progress": 0.0}
                db.commit()

                source_path = Path(paper.file_path).resolve()
                source_hash_before = hashlib.sha256(source_path.read_bytes()).hexdigest()
                derivative_dir = source_path.parent / "derivatives"
                derivative_dir.mkdir(parents=True, exist_ok=True)
                final_path = derivative_dir / f"paper-{paper.id}-parse-{run.version_number}.pdf"
                temporary_path = final_path.with_suffix(".tmp.pdf")
                document = fitz.open(source_path)
                page_results: list[dict[str, object]] = []
                for index, page in enumerate(document):
                    db.refresh(run)
                    if run.cancel_requested:
                        raise InterruptedError("任务已取消。")
                    native_text = page.get_text("text")
                    native_blocks = _native_blocks(page)
                    quality = assess_native_page(native_text, native_blocks)
                    should_ocr = run.mode == "full" or bool(quality["needs_ocr"])
                    if should_ocr:
                        pixmap = page.get_pixmap(matrix=fitz.Matrix(2, 2), alpha=False)
                        result = self.ocr_page(pixmap.tobytes("png"), index + 1)
                        source_type = "local_ocr"
                        confidence = float(result.get("confidence", 0.0))
                        blocks = result.get("blocks", [])
                        text_value = str(result.get("text", ""))
                        if not text_value.strip():
                            raise RuntimeError(f"第 {index + 1} 页 OCR 未返回文字。")
                        if isinstance(blocks, list):
                            for block in blocks:
                                if not isinstance(block, dict) or not str(block.get("text", "")).strip():
                                    continue
                                bbox = block.get("bbox", [20, 20, page.rect.width - 20, page.rect.height - 20])
                                try:
                                    rect = fitz.Rect(*[float(value) for value in bbox])
                                    page.insert_textbox(rect, str(block["text"]), fontsize=6, fontname="china-s", render_mode=3, overlay=True)
                                except (TypeError, ValueError, RuntimeError):
                                    page.insert_textbox(page.rect, str(block["text"]), fontsize=6, fontname="china-s", render_mode=3, overlay=True)
                    else:
                        result = {"tables": [], "formulas": [], "figures": []}
                        source_type = "native"
                        confidence = float(quality["confidence"])
                        blocks = native_blocks
                        text_value = native_text
                    extraction = PaperPageExtraction(
                        parse_run_id=run.id,
                        paper_id=paper.id,
                        page_number=index + 1,
                        source_type=source_type,
                        text=text_value,
                        layout_json=_json(blocks),
                        tables_json=_json(result.get("tables", [])),
                        formulas_json=_json(result.get("formulas", [])),
                        figures_json=_json(result.get("figures", [])),
                        coordinates_json=_json([block.get("bbox", []) for block in blocks if isinstance(block, dict)] if isinstance(blocks, list) else []),
                        confidence=confidence,
                        confirmation_status="not_required",
                    )
                    db.add(extraction)
                    page_results.append({"text": text_value, "confidence": confidence})
                    run.progress = (index + 1) / max(len(document), 1)
                    self.current_task["progress"] = run.progress
                    db.commit()

                candidate_quality = sum(float(item["confidence"]) for item in page_results) / max(len(page_results), 1)
                if candidate_quality + 1e-9 < run.source_quality_score:
                    raise RuntimeError("候选解析质量低于当前版本，已保留原解析。")
                document.save(temporary_path)
                document.close()
                if hashlib.sha256(source_path.read_bytes()).hexdigest() != source_hash_before:
                    raise RuntimeError("原 PDF 完整性校验失败。")
                os.replace(temporary_path, final_path)
                temporary_path = None
                paper.extracted_text = "\n\n".join(str(item["text"]) for item in page_results)
                paper.parse_confidence = candidate_quality
                paper.active_parse_run_id = run.id
                paper.ocr_file_path = str(final_path)
                paper.knowledge_index_stale = True
                run.quality_score = candidate_quality
                run.derivative_file_path = str(final_path)
                run.status = "completed"
                run.completed_at = datetime.utcnow()
                db.execute(update(Analysis).where(Analysis.paper_id == paper.id).values(is_stale=True, stale_reason="论文解析版本已更新"))
                db.execute(update(ScientificDataset).where(ScientificDataset.paper_id == paper.id).values(is_stale=True))
                db.commit()
        except InterruptedError as exc:
            with session_factory() as db:
                db.execute(delete(PaperPageExtraction).where(PaperPageExtraction.parse_run_id == run_id))
                run = db.get(PaperParseRun, run_id)
                if run:
                    run.status = "cancelled"
                    run.error_message = str(exc)
                    run.completed_at = datetime.utcnow()
                db.commit()
        except Exception as exc:
            with session_factory() as db:
                db.execute(delete(PaperPageExtraction).where(PaperPageExtraction.parse_run_id == run_id))
                run = db.get(PaperParseRun, run_id)
                if run:
                    run.status = "failed"
                    run.error_message = str(exc)
                    run.completed_at = datetime.utcnow()
                db.commit()
        finally:
            if temporary_path is not None:
                temporary_path.unlink(missing_ok=True)
            self.current_task = None
            self._job_lock.release()

    @staticmethod
    def recover_interrupted(session_factory) -> None:
        with session_factory() as db:
            db.execute(
                update(PaperParseRun)
                .where(PaperParseRun.status.in_(("queued", "running")))
                .values(status="failed", error_message="应用重启，任务可重试。", completed_at=datetime.utcnow())
            )
            db.commit()

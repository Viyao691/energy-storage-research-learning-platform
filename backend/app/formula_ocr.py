"""Local, bounded formula transcription; no application state is changed."""
import os
from pathlib import Path
import subprocess
import sys
import tempfile
import threading

MODEL_FOLDER = "docling-project--CodeFormulaV2"
_gate = threading.Lock()


class FormulaOcrError(RuntimeError):
    pass


def transcribe_formula(png: bytes, artifacts: Path) -> str:
    model = artifacts / MODEL_FOLDER
    required = ("model.safetensors", "config.json", "tokenizer.json",
                "preprocessor_config.json", "tokenizer_config.json")
    if not all((model / name).is_file() for name in required):
        raise FormulaOcrError("本地公式模型尚未准备，请先显式安装 CodeFormulaV2。")
    if not _gate.acquire(blocking=False):
        raise FormulaOcrError("已有公式正在转写，请等待结束后重试。")
    try:
        with tempfile.TemporaryDirectory(prefix="harness-formula-") as folder:
            root = Path(folder)
            source, output = root / "crop.png", root / "formula.txt"
            source.write_bytes(png)
            env = {**os.environ, "HF_HUB_OFFLINE": "1", "TRANSFORMERS_OFFLINE": "1",
                   "HF_HUB_DISABLE_TELEMETRY": "1", "OMP_NUM_THREADS": "4"}
            subprocess.run(
                [sys.executable, "-m", "app.formula_worker", str(source), str(output), str(artifacts)],
                check=True, timeout=180, env=env, stdin=subprocess.DEVNULL,
                stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL,
                creationflags=subprocess.CREATE_NO_WINDOW if os.name == "nt" else 0,
            )
            if not output.is_file() or output.stat().st_size > 16000:
                raise FormulaOcrError("公式转写未返回有效结果，请缩小框选区域。")
            latex = output.read_text(encoding="utf-8").strip()
            if not latex:
                raise FormulaOcrError("未识别到公式，请重新框选并核对原图。")
            return latex
    except subprocess.TimeoutExpired:
        raise FormulaOcrError("公式转写超时（180 秒），进程已终止，请缩小框选区域后重试。") from None
    except (subprocess.CalledProcessError, OSError):
        raise FormulaOcrError("本地公式转写失败，请检查模型安装或重新框选。") from None
    finally:
        _gate.release()

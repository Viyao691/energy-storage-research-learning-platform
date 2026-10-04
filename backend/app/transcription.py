"""Optional local faster-whisper adapter; never downloads model weights."""

from __future__ import annotations

from pathlib import Path


class LocalWhisperUnavailable(RuntimeError):
    pass


def transcribe_local_audio(audio_path: Path, model_path: Path) -> str:
    if not (model_path / "config.json").is_file():
        raise LocalWhisperUnavailable("本地 Whisper small 模型尚未安装；请先在帮助页确认下载边界")
    try:
        from faster_whisper import WhisperModel
    except ImportError as exc:
        raise LocalWhisperUnavailable("faster-whisper 运行依赖尚未安装") from exc
    model = WhisperModel(str(model_path), device="cpu", compute_type="int8", local_files_only=True)
    segments, _ = model.transcribe(str(audio_path), vad_filter=True)
    transcript = "".join(segment.text for segment in segments).strip()
    if not transcript:
        raise LocalWhisperUnavailable("录音中未识别到可用文字")
    return transcript

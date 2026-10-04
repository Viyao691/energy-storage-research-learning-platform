"""Prometheus metrics with a dependency-free test fallback."""

from __future__ import annotations

try:
    from prometheus_client import CONTENT_TYPE_LATEST, Counter, Histogram, generate_latest

    REQUESTS = Counter("energy_research_http_requests_total", "HTTP requests", ["method", "path", "status"])
    LATENCY = Histogram("energy_research_http_request_seconds", "HTTP request latency", ["method", "path"])

    def observe(method: str, path: str, status: int, seconds: float) -> None:
        REQUESTS.labels(method, path, str(status)).inc(); LATENCY.labels(method, path).observe(seconds)

    def metrics_payload() -> tuple[bytes, str]:
        return generate_latest(), CONTENT_TYPE_LATEST
except ImportError:
    _count = 0

    def observe(method: str, path: str, status: int, seconds: float) -> None:
        global _count
        _count += 1

    def metrics_payload() -> tuple[bytes, str]:
        return f"# TYPE energy_research_http_requests_total counter\nenergy_research_http_requests_total {_count}\n".encode(), "text/plain; version=0.0.4"

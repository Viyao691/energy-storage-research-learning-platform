from pathlib import Path

import yaml


ROOT = Path(__file__).resolve().parents[2]


def test_only_caddy_publishes_ports_and_internal_services_stay_private() -> None:
    compose = yaml.safe_load((ROOT / "docker-compose.production.yml").read_text(encoding="utf-8"))
    services = compose["services"]
    assert set(services["caddy"]["ports"]) == {"80:80", "443:443", "443:443/udp"}
    for name in ("frontend", "backend", "worker", "redis", "postgres"):
        assert "ports" not in services[name]
    assert compose["networks"]["internal"]["internal"] is True
    assert set(services["backend"]["networks"]) == {"internal"}
    assert set(services["redis"]["networks"]) == {"internal"}
    assert set(services["postgres"]["networks"]) == {"internal"}
    frontend_environment = services["frontend"]["environment"]
    assert not {"MODEL_API_KEY", "S3_ACCESS_KEY", "S3_SECRET_KEY", "POSTGRES_PASSWORD", "REDIS_PASSWORD"}.intersection(frontend_environment)


def test_caddy_requires_auth_and_sets_security_headers() -> None:
    caddyfile = (ROOT / "deploy" / "Caddyfile").read_text(encoding="utf-8")
    assert "basic_auth" in caddyfile
    for header in ("Strict-Transport-Security", "X-Content-Type-Options", "X-Frame-Options", "Referrer-Policy", "Permissions-Policy"):
        assert header in caddyfile

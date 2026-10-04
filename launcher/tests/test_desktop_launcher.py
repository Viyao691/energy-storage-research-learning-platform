import sys
import unittest
import json
import subprocess
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))


class DesktopLauncherTests(unittest.TestCase):
    def test_powershell_startup_falls_back_to_docker_desktop_cli_path(self):
        source = (Path(__file__).resolve().parents[2] / "start.ps1").read_text(encoding="utf-8")
        self.assertIn("function Get-DockerExecutable", source)
        self.assertIn("resources\\bin\\docker.exe", source)

    def test_wait_url_reports_ready_when_probe_succeeds(self):
        from desktop_launcher import wait_for_url

        self.assertTrue(wait_for_url("http://localhost:3000", timeout_seconds=1, probe=lambda _: True))

    def test_wait_url_returns_false_after_timeout(self):
        from desktop_launcher import wait_for_url

        self.assertFalse(wait_for_url("http://localhost:3000", timeout_seconds=0, probe=lambda _: False))

    def test_compose_command_starts_the_stack_with_harness_override_by_default(self):
        from desktop_launcher import compose_command

        self.assertEqual(
            compose_command(),
            ["docker", "compose", "-f", "docker-compose.yml", "-f", "docker-compose.harness.yml", "up", "-d"],
        )
        self.assertEqual(
            compose_command(rebuild=True),
            ["docker", "compose", "-f", "docker-compose.yml", "-f", "docker-compose.harness.yml", "up", "-d", "--build"],
        )

    def test_compose_command_standard_flag_uses_plain_compose(self):
        from desktop_launcher import compose_command

        self.assertEqual(compose_command(standard=True), ["docker", "compose", "up", "-d"])
        self.assertEqual(
            compose_command(rebuild=True, standard=True),
            ["docker", "compose", "up", "-d", "--build"],
        )

    def test_powershell_rebuild_is_opt_in_for_daily_startup(self):
        source = (Path(__file__).resolve().parents[2] / "start.ps1").read_text(encoding="utf-8")

        self.assertIn("[switch]$Rebuild", source)
        self.assertIn("if ($Rebuild)", source)
        self.assertIn("$composeArguments += '--build'", source)

    def test_powershell_uses_harness_override_by_default_with_standard_opt_out(self):
        source = (Path(__file__).resolve().parents[2] / "start.ps1").read_text(encoding="utf-8")

        self.assertIn("-f", source)
        self.assertIn("docker-compose.harness.yml", source)
        self.assertIn("[switch]$Standard", source)
        self.assertIn("if (-not $Standard)", source)

    def test_powershell_startup_removes_only_this_projects_stale_next_dev_server(self):
        source = (Path(__file__).resolve().parents[2] / "start.ps1").read_text(encoding="utf-8")

        self.assertIn("function Stop-ProjectNextDevServer", source)
        self.assertIn("Get-CimInstance Win32_Process", source)
        self.assertIn("taskkill.exe", source)
        self.assertIn("Join-Path $Root 'frontend'", source)
        self.assertIn("next", source)
        self.assertIn("dev", source)

    def test_powershell_probes_docker_through_ipv4_backend_health(self):
        source = (Path(__file__).resolve().parents[2] / "start.ps1").read_text(encoding="utf-8")

        self.assertIn('"http://127.0.0.1:$frontendHostPort/backend-api/health"', source)
        self.assertIn("$response.status -eq 'ok'", source)

    def test_frontend_host_port_selection_uses_first_free_port(self):
        selector = Path(__file__).resolve().parents[1] / "port_selection.ps1"
        script = (
            f". '{selector}'; "
            "Resolve-FrontendHostPort -OccupiedPorts @(3000, 3001); "
            "Resolve-FrontendHostPort -OccupiedPorts @()"
        )
        result = subprocess.run(
            ["powershell.exe", "-NoProfile", "-ExecutionPolicy", "Bypass", "-Command", script],
            capture_output=True, text=True, check=True,
        )
        self.assertEqual(result.stdout.splitlines(), ["3002", "3000"])

    def test_compose_frontend_host_port_is_configurable(self):
        source = (Path(__file__).resolve().parents[2] / "docker-compose.yml").read_text(encoding="utf-8")
        self.assertIn('127.0.0.1:${FRONTEND_HOST_PORT:-3000}:3000', source)

    def test_local_next_development_uses_a_nonproduction_port(self):
        package = json.loads(
            (Path(__file__).resolve().parents[2] / "frontend" / "package.json").read_text(
                encoding="utf-8"
            )
        )

        self.assertEqual(package["scripts"]["dev"], "next dev -p 3001")

    def test_stop_script_is_ascii_safe_for_windows_powershell_51(self):
        source = (Path(__file__).resolve().parents[2] / "stop.ps1").read_bytes()

        source.decode("ascii")

$ErrorActionPreference = "Stop"

$configJson = docker compose config --format json 2>$null
if ($LASTEXITCODE -ne 0) {
    throw "Unable to read Docker Compose config."
}

$config = $configJson | ConvertFrom-Json

foreach ($serviceName in @("backend", "frontend")) {
    $ports = @($config.services.$serviceName.ports)
    if ($ports.Count -eq 0) {
        throw "$serviceName does not publish a local port."
    }
    foreach ($port in $ports) {
        if ($port.host_ip -ne "127.0.0.1") {
            throw "$serviceName is not bound only to 127.0.0.1."
        }
    }
}

$frontendEnvironment = @($config.services.frontend.environment.PSObject.Properties.Name)
$forbiddenFrontendSecrets = @(
    "MODEL_API_KEY",
    "SEMANTIC_SCHOLAR_API_KEY",
    "SMTP_PASSWORD"
)
foreach ($secretName in $forbiddenFrontendSecrets) {
    if ($frontendEnvironment -contains $secretName) {
        throw "Frontend must not receive backend secret: $secretName"
    }
}

if ($frontendEnvironment -notcontains "BACKEND_API_URL") {
    throw "Frontend is missing BACKEND_API_URL."
}

$backendExtraHosts = [string](
    $config.services.backend.extra_hosts | ConvertTo-Json -Compress
)
if (
    [string]::IsNullOrWhiteSpace($backendExtraHosts) -or
    $backendExtraHosts -notmatch "host\.docker\.internal" -or
    $backendExtraHosts -notmatch "host-gateway"
) {
    throw "Backend is missing the Ollama host-gateway mapping."
}

Write-Host "Docker Compose local binding and frontend secret boundary checks passed."

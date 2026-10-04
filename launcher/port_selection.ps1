function Resolve-BackendHostPort {
    param(
        [int[]]$OccupiedPorts = @(),
        [int]$PreferredPort = 8000,
        [int]$MaximumPort = 8099
    )

    for ($candidate = $PreferredPort; $candidate -le $MaximumPort; $candidate++) {
        if ($OccupiedPorts -notcontains $candidate) { return $candidate }
    }
    throw "No free backend port is available from $PreferredPort through $MaximumPort."
}

function Resolve-FrontendHostPort {
    param(
        [int[]]$OccupiedPorts = @(),
        [int]$PreferredPort = 3000,
        [int]$MaximumPort = 3099
    )

    for ($candidate = $PreferredPort; $candidate -le $MaximumPort; $candidate++) {
        if ($OccupiedPorts -notcontains $candidate) { return $candidate }
    }
    throw "No free frontend port is available from $PreferredPort through $MaximumPort."
}

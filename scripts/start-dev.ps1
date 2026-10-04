$ErrorActionPreference = 'Stop'

$repoRoot = Split-Path -Parent $PSScriptRoot
$url = 'http://127.0.0.1:3000/careunfold-test'
$setupMarker = '<p id="setup">Load the development extension from .output/chrome-mv3-dev, then refresh this page.</p>'
$stdout = Join-Path $repoRoot '.output\dev-server.out.log'
$stderr = Join-Path $repoRoot '.output\dev-server.err.log'

function Get-ReadyResponse {
    try {
        $response = Invoke-WebRequest -Uri $url -TimeoutSec 2 -UseBasicParsing
        if ($response.StatusCode -eq 200 -and $response.Content.Contains($setupMarker)) {
            return $response
        }
    } catch {
        return $null
    }

    return $null
}

function Get-DevServerListeners {
    @(
        Get-NetTCPConnection -LocalPort 3000 -State Listen -ErrorAction SilentlyContinue |
            Where-Object { $_.LocalAddress -in @('127.0.0.1', '0.0.0.0', '::') }
    )
}

function Get-ProcessLabel($targetProcessId) {
    $process = Get-Process -Id $targetProcessId -ErrorAction SilentlyContinue
    if ($process) { return "$($process.ProcessName) (PID $targetProcessId)" }
    return "PID $targetProcessId"
}

$ready = Get-ReadyResponse
if (-not $ready) {
    $listeners = Get-DevServerListeners
    if ($listeners.Count -gt 0) {
        $owners = @($listeners | Select-Object -ExpandProperty OwningProcess -Unique)
        $processLabels = @($owners | ForEach-Object { Get-ProcessLabel $_ })
        throw "Port 3000 is occupied by $($processLabels -join ', '), but $url did not return the CareUnfold setup page. No process was stopped. Free the port and retry."
    }

    New-Item -ItemType Directory -Path (Split-Path -Parent $stdout) -Force | Out-Null
    $npm = Get-Command npm.cmd -ErrorAction Stop
    $started = Start-Process -FilePath $npm.Source -ArgumentList @('run', 'dev') -WorkingDirectory $repoRoot -WindowStyle Hidden -RedirectStandardOutput $stdout -RedirectStandardError $stderr -PassThru

    $deadline = [DateTime]::UtcNow.AddSeconds(30)
    do {
        Start-Sleep -Milliseconds 500
        $ready = Get-ReadyResponse
    } while (-not $ready -and [DateTime]::UtcNow -lt $deadline)

    if (-not $ready) {
        $listeners = Get-DevServerListeners
        if ($listeners.Count -gt 0) {
            $owners = @($listeners | Select-Object -ExpandProperty OwningProcess -Unique)
            $processLabels = @($owners | ForEach-Object { Get-ProcessLabel $_ })
            throw "Port 3000 is occupied by $($processLabels -join ', '), but the CareUnfold setup page did not become ready within 30 seconds. Server logs: $stdout and $stderr."
        }
        throw "The CareUnfold development server did not become ready within 30 seconds. Started process PID $($started.Id). Server logs: $stdout and $stderr."
    }
}

$owners = @(Get-DevServerListeners | Select-Object -ExpandProperty OwningProcess -Unique)
$processLabels = @($owners | ForEach-Object { Get-ProcessLabel $_ })
Write-Host "CareUnfold development server is ready at $url (process: $($processLabels -join ', '))."

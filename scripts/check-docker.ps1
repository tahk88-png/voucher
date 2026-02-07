# PowerShell script to check and start Docker Desktop
param(
    [int]$MaxWaitSeconds = 120,
    [int]$CheckIntervalSeconds = 3
)

Write-Host "Checking Docker Desktop status..." -ForegroundColor Cyan

# Function to check if Docker is ready
function Test-DockerReady {
    docker info 2>&1 | Out-Null
    return $LASTEXITCODE -eq 0
}

# Check if Docker Desktop is already running
if (Test-DockerReady) {
    Write-Host "✅ Docker Desktop is running" -ForegroundColor Green
    exit 0
}

Write-Host "❌ Docker Desktop is not running" -ForegroundColor Red
Write-Host ""

# Try to start Docker Desktop
$dockerPath = "${env:ProgramFiles}\Docker\Docker\Docker Desktop.exe"
if (-not (Test-Path $dockerPath)) {
    Write-Host "Docker Desktop not found at: $dockerPath" -ForegroundColor Red
    Write-Host "Please install Docker Desktop from: https://www.docker.com/products/docker-desktop" -ForegroundColor Yellow
    exit 1
}

Write-Host "Attempting to start Docker Desktop..." -ForegroundColor Yellow
Start-Process $dockerPath

# Wait for Docker Desktop to start
Write-Host "Waiting for Docker Desktop to start (this may take 30-60 seconds)..." -ForegroundColor Yellow
$elapsed = 0
$startTime = Get-Date

while ($elapsed -lt $MaxWaitSeconds) {
    Start-Sleep -Seconds $CheckIntervalSeconds
    $elapsed = ((Get-Date) - $startTime).TotalSeconds
    
    if (Test-DockerReady) {
        Write-Host "✅ Docker Desktop is now running!" -ForegroundColor Green
        # Give it a few more seconds to fully initialize
        Start-Sleep -Seconds 5
        exit 0
    }
    
    $remaining = [math]::Max(0, $MaxWaitSeconds - $elapsed)
    Write-Host "  Still waiting... (${remaining}s remaining)" -ForegroundColor Gray
}

Write-Host "❌ Docker Desktop did not start within ${MaxWaitSeconds} seconds" -ForegroundColor Red
Write-Host "Please:" -ForegroundColor Yellow
Write-Host "  1. Check if Docker Desktop is starting manually" -ForegroundColor Yellow
Write-Host "  2. Wait for it to fully start (whale icon in system tray)" -ForegroundColor Yellow
Write-Host "  3. Run this script again" -ForegroundColor Yellow
exit 1

# PowerShell script to wait for database to be ready
param(
    [int]$MaxAttempts = 60,
    [int]$DelaySeconds = 2
)

Write-Host "Waiting for PostgreSQL database to be ready..." -ForegroundColor Cyan

$attempt = 0
while ($attempt -lt $MaxAttempts) {
    $attempt++
    
    try {
        $tcp = New-Object System.Net.Sockets.TcpClient
        $tcp.Connect("127.0.0.1", 5433)
        $tcp.Close()
        Write-Host "✅ Database is ready!" -ForegroundColor Green
        Start-Sleep -Seconds 2
        exit 0
    } catch {
        # Connection failed, continue
    }
    
    if ($attempt -lt $MaxAttempts) {
        $remaining = $MaxAttempts - $attempt
        if ($attempt % 5 -eq 0) {
            Write-Host "  Still waiting... (${remaining} attempts remaining)" -ForegroundColor Gray
        }
        Start-Sleep -Seconds $DelaySeconds
    }
}

Write-Host "❌ Database is not ready after $MaxAttempts attempts" -ForegroundColor Red
Write-Host "Please check:" -ForegroundColor Yellow
Write-Host "  1. Docker Desktop is running" -ForegroundColor Yellow
Write-Host "  2. Containers are up: docker ps" -ForegroundColor Yellow
Write-Host "  3. Check logs: docker compose logs postgres" -ForegroundColor Yellow
exit 1

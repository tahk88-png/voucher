# Full dev startup: .env.local, Docker Postgres, db push, seed/ensure-test-user, dev server
# Run: npm run dev:full

$ErrorActionPreference = "Continue"
$root = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
Set-Location $root

docker info 2>&1 | Out-Null
if ($LASTEXITCODE -ne 0) {
  Write-Host "[dev-full] Docker ei käivitu. Käivita Docker Desktop ja proovi: npm run dev:full" -ForegroundColor Red
  exit 1
}

$envLocalPath = Join-Path $root ".env.local"

# Read existing .env.local values to keep dev credentials stable between runs.
function Get-EnvValueFromFile {
  param(
    [string]$path,
    [string]$key
  )

  if (-not (Test-Path $path)) { return $null }
  $line = Get-Content -Path $path | Where-Object { $_ -match "^\s*$key\s*=" } | Select-Object -First 1
  if (-not $line) { return $null }
  $value = ($line -replace "^\s*$key\s*=\s*", "").Trim()
  return $value.Trim('"')
}

$pgUser = $env:POSTGRES_USER
if (-not $pgUser) { $pgUser = Get-EnvValueFromFile -path $envLocalPath -key "POSTGRES_USER" }
if (-not $pgUser) { $pgUser = "voucher_user" }

$pgPassword = $env:POSTGRES_PASSWORD
if (-not $pgPassword) { $pgPassword = Get-EnvValueFromFile -path $envLocalPath -key "POSTGRES_PASSWORD" }
if (-not $pgPassword) {
  $existingUrl = Get-EnvValueFromFile -path $envLocalPath -key "DATABASE_URL"
  if ($existingUrl -and $existingUrl -match "^postgresql://[^:]+:(?<pass>[^@]+)@") {
    $pgPassword = $Matches["pass"]
  }
}
if (-not $pgPassword) { $pgPassword = [System.Guid]::NewGuid().ToString("N") }

$pgDb = $env:POSTGRES_DB
if (-not $pgDb) { $pgDb = Get-EnvValueFromFile -path $envLocalPath -key "POSTGRES_DB" }
if (-not $pgDb) { $pgDb = "voucher_db" }

$authSecret = $env:AUTH_SECRET
if (-not $authSecret) { $authSecret = Get-EnvValueFromFile -path $envLocalPath -key "AUTH_SECRET" }
if (-not $authSecret) { $authSecret = [System.Guid]::NewGuid().ToString("N") }

$localUrl = "postgresql://$($pgUser):$($pgPassword)@localhost:5433/$pgDb"

# 1) .env.local (local Postgres + AUTH_SECRET, et Next.js ja auth t??taks)
@"
# Local Docker Postgres (dev:full)
POSTGRES_USER="$pgUser"
POSTGRES_PASSWORD="$pgPassword"
POSTGRES_DB="$pgDb"
DATABASE_URL="$localUrl"
AUTH_SECRET="$authSecret"
"@ | Set-Content -Path $envLocalPath -Encoding utf8 -Force
Write-Host "[dev-full] .env.local ok" -ForegroundColor Green

# 2) Docker Postgres
Write-Host "[dev-full] Starting Postgres..." -ForegroundColor Cyan
docker compose --env-file $envLocalPath up -d postgres 2>&1 | Out-Null

Write-Host "[dev-full] Waiting for DB..." -ForegroundColor Cyan
& "$PSScriptRoot\wait-for-db.ps1" -MaxAttempts 30 -DelaySeconds 2
if ($LASTEXITCODE -ne 0) {
  Write-Host "[dev-full] DB not ready. Check: docker compose logs postgres" -ForegroundColor Red
  exit 1
}

# 3) Prisma + seed (DATABASE_URL for Prisma CLI)
$env:DATABASE_URL = $localUrl

Write-Host "[dev-full] prisma db push..." -ForegroundColor Cyan
npx prisma db push

Write-Host "[dev-full] db:seed (may fail if data exists)..." -ForegroundColor Cyan
& npm run db:seed 2>&1 | Out-Null

Write-Host "[dev-full] db:ensure-test-user..." -ForegroundColor Cyan
& npm run db:ensure-test-user
if ($LASTEXITCODE -ne 0) {
  Write-Host "[dev-full] ensure-test-user ebaõnnestus" -ForegroundColor Red
  exit 1
}

Write-Host "[dev-full] Test: test@example.com / test123" -ForegroundColor Green
Write-Host "[dev-full] Starting dev server..." -ForegroundColor Cyan
npm run dev

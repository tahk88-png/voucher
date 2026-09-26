#!/usr/bin/env node
/**
 * `npm run db:check`: make sure the Docker daemon is reachable.
 *
 * On Windows this runs scripts/check-docker.ps1, which also starts Docker
 * Desktop and waits for it. Elsewhere it checks `docker info` and explains
 * what to do; starting the daemon is left to the user (systemd, Docker
 * Desktop for Mac, colima...).
 */
const { spawnSync } = require('node:child_process');
const { join } = require('node:path');

if (process.platform === 'win32') {
  const ps = spawnSync(
    'powershell',
    ['-ExecutionPolicy', 'Bypass', '-File', join(__dirname, 'check-docker.ps1')],
    { stdio: 'inherit' }
  );
  if (ps.error) {
    console.error(`[db:check] could not run PowerShell: ${ps.error.message}`);
    process.exit(1);
  }
  process.exit(ps.status ?? 1);
}

const info = spawnSync('docker', ['info'], { stdio: 'ignore' });
if (info.error) {
  console.error('[db:check] the docker command was not found. Install Docker: https://docs.docker.com/get-docker/');
  process.exit(1);
}
if (info.status !== 0) {
  console.error('[db:check] Docker is installed but its daemon is not reachable.');
  console.error('  Start Docker (Linux: sudo systemctl start docker; macOS: open Docker Desktop) and run this again.');
  process.exit(1);
}
console.log('Docker is running.');

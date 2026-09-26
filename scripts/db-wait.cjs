#!/usr/bin/env node
/**
 * `npm run db:wait`: wait until PostgreSQL answers on its TCP port.
 *
 * Cross-platform replacement for the Windows-only wait-for-db.ps1 (which
 * dev-full.ps1 still uses). Host and port come from DATABASE_URL (env, then
 * .env.local, then .env), defaulting to docker-compose.yml's 127.0.0.1:5433.
 *
 * A bare TCP connect is not enough: Docker's port proxy accepts connections on
 * a published port before Postgres inside the container listens. So the probe
 * sends Postgres' 8-byte SSLRequest and waits for its one-byte answer
 * ('S' or 'N'), which only a running server gives.
 *
 * Usage: node scripts/db-wait.cjs [maxAttempts=60] [delaySeconds=2]
 */
const net = require('node:net');
const { existsSync, readFileSync } = require('node:fs');
const { join, resolve } = require('node:path');

const ROOT = resolve(__dirname, '..');
const maxAttempts = Number(process.argv[2]) || 60;
const delayMs = (Number(process.argv[3]) || 2) * 1000;

function loadDatabaseUrl() {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;
  for (const f of ['.env.local', '.env']) {
    const p = join(ROOT, f);
    if (!existsSync(p)) continue;
    const m = readFileSync(p, 'utf8').match(/^DATABASE_URL\s*=\s*"?([^"\r\n]+)"?/m);
    if (m) return m[1];
  }
  return null;
}

let host = '127.0.0.1';
let port = 5433;
const url = loadDatabaseUrl();
if (url) {
  try {
    const parsed = new URL(url);
    // "localhost" can resolve to ::1 first while Docker publishes on IPv4 only.
    host = parsed.hostname === 'localhost' ? '127.0.0.1' : parsed.hostname;
    port = Number(parsed.port) || 5432;
  } catch {
    console.error('[db-wait] DATABASE_URL is not a valid URL');
    process.exit(1);
  }
}

// Length 8, then the SSLRequest code 80877103.
const SSL_REQUEST = Buffer.from([0, 0, 0, 8, 0x04, 0xd2, 0x16, 0x2f]);

function probe() {
  return new Promise((resolveProbe) => {
    let settled = false;
    const finish = (ready) => {
      if (settled) return;
      settled = true;
      socket.destroy();
      resolveProbe(ready);
    };
    const socket = net.connect({ host, port });
    socket.setTimeout(2000);
    socket.once('connect', () => socket.write(SSL_REQUEST));
    socket.once('data', (chunk) => finish(chunk[0] === 0x53 || chunk[0] === 0x4e)); // 'S' | 'N'
    socket.once('timeout', () => finish(false));
    socket.once('close', () => finish(false));
    socket.once('error', () => finish(false));
  });
}

(async () => {
  console.log(`Waiting for PostgreSQL on ${host}:${port}...`);
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    if (await probe()) {
      console.log('Database is accepting connections.');
      return;
    }
    if (attempt % 5 === 0) console.log(`  still waiting (${maxAttempts - attempt} attempts left)`);
    await new Promise((r) => setTimeout(r, delayMs));
  }
  console.error(`[db-wait] no PostgreSQL answered on ${host}:${port} after ${maxAttempts} attempts.`);
  console.error('  Check: docker compose ps, docker compose logs postgres');
  process.exit(1);
})();

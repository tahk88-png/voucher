#!/usr/bin/env node
/**
 * Start/stop a LOCAL native PostgreSQL cluster for development.
 *
 * Why this exists: `npm run docker:up` is the normal path, but Docker is not
 * always usable (daemon down, host port already claimed by another project).
 * On those machines a native cluster under ./.pgdata is the fallback, and it
 * has to be launched detached — a plain `pg_ctl start` inherited from a shell
 * dies with that shell and leaves a stale postmaster.pid behind.
 *
 * Usage:
 *   node scripts/db-local.cjs start   # init (first run) + start, detached
 *   node scripts/db-local.cjs stop
 *   node scripts/db-local.cjs status
 *
 * Port/credentials come from DATABASE_URL so this stays in sync with .env.local.
 */
const { execFileSync, spawn } = require('node:child_process');
const { existsSync, rmSync, readFileSync } = require('node:fs');
const { join, resolve } = require('node:path');

const ROOT = resolve(__dirname, '..');
const PGDATA = join(ROOT, '.pgdata');

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

const url = loadDatabaseUrl();
if (!url) {
  console.error('[db-local] No DATABASE_URL found in env, .env.local or .env');
  process.exit(1);
}
let parsed;
try {
  parsed = new URL(url);
} catch {
  console.error('[db-local] DATABASE_URL is not a valid URL');
  process.exit(1);
}
const PORT = parsed.port || '5432';
const USER = decodeURIComponent(parsed.username || 'postgres');
const DB = parsed.pathname.replace(/^\//, '').split('?')[0] || 'postgres';

// Locate the PostgreSQL bin dir (Windows default install, or PATH).
function bin(name) {
  const exe = process.platform === 'win32' ? `${name}.exe` : name;
  const candidates = [];
  if (process.env.PGBIN) candidates.push(join(process.env.PGBIN, exe));
  if (process.platform === 'win32') {
    for (const v of ['17', '16', '15', '14']) {
      candidates.push(`C:/Program Files/PostgreSQL/${v}/bin/${exe}`);
    }
  }
  for (const c of candidates) if (existsSync(c)) return c;
  return exe; // fall back to PATH
}

function isReady() {
  try {
    execFileSync(bin('pg_isready'), ['-h', 'localhost', '-p', PORT, '-q'], { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

function waitReady(seconds = 40) {
  const deadline = Date.now() + seconds * 1000;
  while (Date.now() < deadline) {
    if (isReady()) return true;
    // busy-wait in 500ms slices — keeps this dependency-free
    const t = Date.now() + 500;
    while (Date.now() < t) { /* spin */ }
  }
  return false;
}

const cmd = process.argv[2] || 'start';

if (cmd === 'status') {
  console.log(`[db-local] port ${PORT}: ${isReady() ? 'accepting connections' : 'not responding'}`);
  process.exit(isReady() ? 0 : 1);
}

if (cmd === 'stop') {
  try {
    execFileSync(bin('pg_ctl'), ['-D', PGDATA, '-m', 'fast', 'stop'], { stdio: 'inherit' });
  } catch {
    console.error('[db-local] stop failed (was it running?)');
    process.exit(1);
  }
  process.exit(0);
}

if (cmd !== 'start') {
  console.error(`[db-local] unknown command "${cmd}" — use start | stop | status`);
  process.exit(1);
}

if (isReady()) {
  console.log(`[db-local] already accepting connections on port ${PORT}`);
  process.exit(0);
}

// First run: create the cluster. `--auth=trust` is deliberate — this is a
// localhost-only development cluster, never a deployment target.
if (!existsSync(join(PGDATA, 'PG_VERSION'))) {
  console.log(`[db-local] initializing cluster at ${PGDATA} (user: ${USER})`);
  execFileSync(bin('initdb'), ['-D', PGDATA, '-U', USER, '-E', 'UTF8', '--auth=trust'], {
    stdio: 'inherit',
  });
}

// A stale pid file from a cluster whose process was killed blocks startup.
const pidFile = join(PGDATA, 'postmaster.pid');
if (existsSync(pidFile) && !isReady()) {
  console.log('[db-local] removing stale postmaster.pid');
  rmSync(pidFile, { force: true });
}

console.log(`[db-local] starting on port ${PORT} (detached)`);
// Detached so the cluster outlives the shell/session that started it.
const child = spawn(
  bin('pg_ctl'),
  ['-D', PGDATA, '-o', `-p ${PORT}`, '-l', join(PGDATA, 'server.log'), 'start'],
  { detached: true, stdio: 'ignore', windowsHide: true }
);
child.unref();

if (!waitReady()) {
  console.error(`[db-local] did not become ready — see ${join(PGDATA, 'server.log')}`);
  process.exit(1);
}
console.log(`[db-local] ready on port ${PORT}`);

// Ensure the application database exists (createdb is a no-op error if it does).
try {
  execFileSync(bin('createdb'), ['-h', 'localhost', '-p', PORT, '-U', USER, DB], { stdio: 'ignore' });
  console.log(`[db-local] created database "${DB}"`);
} catch {
  console.log(`[db-local] database "${DB}" already exists`);
}
console.log('[db-local] next: npm run db:push && npm run db:seed');

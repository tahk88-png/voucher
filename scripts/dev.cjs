// Dev-server launcher that applies the same Node-22/Windows EISDIR preload
// the production build uses. Plain `next dev` omits this preload, so on
// Node 22+ Windows webpack's fs.readlink hits the EISDIR bug during the
// first compile and the dev server hangs at "Starting…" without ever
// reaching "Ready". Mirroring build.cjs's NODE_OPTIONS fixes that.
const { spawn } = require('child_process');
const path = require('path');

const fixPath = path.resolve(__dirname, '..', 'fix-eisdir.js');
const nodeOpts = process.env.NODE_OPTIONS || '';
const env = { ...process.env, NODE_OPTIONS: `${nodeOpts} --require ${fixPath}`.trim() };

// Use spawn (not execSync) so the long-running dev server streams output
// and forwards signals cleanly.
const child = spawn('npx', ['next', 'dev', ...process.argv.slice(2)], {
  stdio: 'inherit',
  env,
  shell: process.platform === 'win32',
});

child.on('exit', (code) => process.exit(code ?? 0));
process.on('SIGINT', () => child.kill('SIGINT'));
process.on('SIGTERM', () => child.kill('SIGTERM'));

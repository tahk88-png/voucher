const { execSync } = require('child_process');

try {
  execSync('npx prisma generate', { stdio: 'inherit' });
} catch {
  // EPERM on Windows when query_engine DLL is locked (next dev, prisma studio, etc). Existing client is usually fine.
}

// Node.js 22 + Windows: preload EISDIR→EINVAL patch for webpack compatibility
const path = require('path');
const fixPath = path.resolve(__dirname, '..', 'fix-eisdir.js');
const nodeOpts = process.env.NODE_OPTIONS || '';
const env = { ...process.env, NODE_OPTIONS: `${nodeOpts} --require ${fixPath}`.trim() };
execSync('npx next build', { stdio: 'inherit', env });

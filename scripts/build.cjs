const { execSync } = require('child_process');

try {
  execSync('npx prisma generate', { stdio: 'inherit' });
} catch {
  // EPERM on Windows when query_engine DLL is locked (next dev, prisma studio, etc). Existing client is usually fine.
}

execSync('npx next build', { stdio: 'inherit' });

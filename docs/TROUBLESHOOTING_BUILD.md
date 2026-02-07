# Build & Cache Troubleshooting

## Common Next.js Build Errors

### Module Not Found Errors

If you see errors like:

```text
Error: Cannot find module './9380.js'
Error: Cannot find module './1682.js'
```

This indicates a corrupted Next.js build cache.

**Solution:**

1. **Clean build cache:**

   ```bash
   npm run clean
   ```

2. **Or manually:**

   ```bash
   # Delete .next folder
   rm -rf .next
   # On Windows:
   rmdir /s /q .next
   ```

3. **Restart dev server:**

   ```bash
   npm run dev
   ```

### Webpack Cache Errors

If you see:

```text
[webpack.cache.PackFileCacheStrategy] Caching failed for pack
```

This is usually harmless but can be fixed by:

1. **Clean cache:**

   ```bash
   npm run clean
   ```

2. **Or delete cache folder:**

   ```bash
   rm -rf .next/cache
   # On Windows:
   rmdir /s /q .next\cache
   ```

### Build Fails

If `npm run build` fails:

1. **Clean everything:**

   ```bash
   npm run clean
   ```

2. **Reinstall dependencies (if needed):**

   ```bash
   rm -rf node_modules
   npm install
   ```

3. **Rebuild:**

   ```bash
   npm run build
   ```

### Development Server Issues

If dev server has issues:

1. **Stop the server** (Ctrl+C)

2. **Clean build:**

   ```bash
   npm run dev:clean
   ```

   This automatically:
   - Deletes `.next` folder
   - Starts dev server

### TypeScript Errors After Changes

If TypeScript shows errors after code changes:

1. **Restart TypeScript server** in your IDE
2. **Or clean and rebuild:**

   ```bash
   npm run clean
   npm run dev
   ```

## Quick Fix Script

For most build issues, run:

```bash
npm run clean && npm run dev
```

This cleans the build cache and restarts the dev server.

## When to Clean

Clean the build cache when:

- Module not found errors appear
- Build fails unexpectedly
- After major dependency updates
- After changing Next.js configuration
- When seeing webpack cache errors
- After switching branches with significant changes

## Prevention

To avoid build cache issues:

- Don't manually edit files in `.next` folder
- Use `npm run dev:clean` if you suspect cache issues
- Keep dependencies up to date
- Don't interrupt builds mid-process

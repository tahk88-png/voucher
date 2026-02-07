# Troubleshooting

## Build Cache Issues

If you see errors like `Cannot find module './9380.js'` or webpack cache errors:

1. **Clean build cache:**

   ```bash
   npm run clean
   ```

2. **Restart dev server:**

   ```bash
   npm run dev
   ```

See [TROUBLESHOOTING_BUILD.md](TROUBLESHOOTING_BUILD.md) for more details.

---

## Docker Desktop Issues

### Problem: "Docker Desktop is unable to start"

#### Solution 1: Start Docker Desktop manually

1. Open Docker Desktop from Start Menu
2. Wait for it to fully start (whale icon in system tray)
3. Run `npm run docker:up` again

#### Solution 2: Restart Docker Desktop

```powershell
# Stop Docker Desktop
Stop-Process -Name "Docker Desktop" -Force

# Start Docker Desktop
Start-Process "${env:ProgramFiles}\Docker\Docker\Docker Desktop.exe"

# Wait 30-60 seconds, then check
docker info
```

#### Solution 3: Check WSL2 (Windows)

Docker Desktop requires WSL2 on Windows:

```powershell
# Check WSL version
wsl --list --verbose

# If WSL2 is not installed, install it:
wsl --install
```

#### Solution 4: Restart Windows

Sometimes Docker Desktop needs a system restart to work properly.

### Problem: "Can't reach database server at `localhost:5432`"

**Check if Docker containers are running:**

```powershell
docker ps
```

**If containers are not running:**

```powershell
# Start containers
npm run docker:up

# Or manually
docker compose up -d
```

**Check container logs:**

```powershell
npm run docker:logs

# Or manually
docker compose logs postgres
```

**Verify database connection:**

```powershell
# Wait for database to be ready
npm run db:wait

# Or check manually
Test-NetConnection -ComputerName localhost -Port 5432
```

## Database Setup

### Quick Setup (Recommended)

```powershell
# This will:
# 1. Check Docker Desktop
# 2. Start containers
# 3. Wait for database
# 4. Push schema
# 5. Seed data
npm run db:setup
```

### Manual Setup

```powershell
# Step 1: Check Docker
npm run db:check

# Step 2: Start containers
npm run docker:up

# Step 3: Wait for database
npm run db:wait

# Step 4: Push schema
npm run db:push

# Step 5: Seed data
npm run db:seed
```

## Environment Variables

Make sure `.env` file exists with:

```env
DATABASE_URL="postgresql://voucher_user:voucher_pass@localhost:5432/voucher_db?schema=public"
```

## Common Issues

### Port 5432 already in use

If PostgreSQL is already running on port 5432:

1. Stop the existing PostgreSQL service
2. Or change the port in `docker-compose.yml`

### Prisma Client not generated

```powershell
npx prisma generate
```

### Migration issues

```powershell
# Reset database (WARNING: deletes all data)
npx prisma migrate reset

# Or create a new migration
npm run db:migrate
```

## Getting Help

1. Check Docker Desktop logs: `docker compose logs`
2. Check Prisma logs: `npm run db:push` (verbose output)
3. Verify `.env` file has correct `DATABASE_URL`
4. Ensure Docker Desktop has enough resources (Settings > Resources)

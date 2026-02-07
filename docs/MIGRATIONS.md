# Database Migrations Guide

This guide explains how to use Prisma migrations for safe database schema changes.

## Current State

The project currently uses `prisma db push` for development, which is fine for rapid iteration but not suitable for production.

**Note**: To migrate from `db:push` to migrations, you need to:
1. Ensure your database schema matches `schema.prisma`
2. Create a baseline migration: `npx prisma migrate dev --name init --create-only`
3. If shadow database issues occur, use: `npx prisma migrate dev --name init` (will create and apply)

## Migration Workflow

### Development

1. **Make schema changes** in `prisma/schema.prisma`

2. **Create migration**:

   ```bash
   npx prisma migrate dev --name descriptive_migration_name
   ```

   This will:
   - Create a new migration file in `prisma/migrations/`
   - Apply the migration to your development database
   - Regenerate Prisma Client

3. **Review migration SQL** in `prisma/migrations/[timestamp]_descriptive_migration_name/migration.sql`

4. **Test the migration**:

   ```bash
   npm run db:push  # Reset and test
   npx prisma migrate dev  # Apply migration
   ```

### Production

1. **Generate migration** (without applying):

   ```bash
   npx prisma migrate dev --create-only --name migration_name
   ```

2. **Review migration SQL** carefully

3. **Test migration on staging** first

4. **Apply to production**:

   ```bash
   npx prisma migrate deploy
   ```

   This applies all pending migrations without prompting.

## Migration Best Practices

### 1. Always Review Generated SQL

Before applying migrations, review the generated SQL:

```bash
cat prisma/migrations/[timestamp]_migration_name/migration.sql
```

### 2. Backward Compatibility

- Add new columns as `nullable` first, then populate, then make required
- Add new tables before adding foreign keys
- Use `@default()` for new required fields

### 3. Data Migrations

For data transformations, create a separate migration script:

```typescript
// prisma/migrations/[timestamp]_migration_name/migrate-data.ts
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  // Your data migration logic
  await prisma.user.updateMany({
    where: { /* condition */ },
    data: { /* updates */ },
  });
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
```

### 4. Rollback Strategy

Prisma doesn't support automatic rollbacks. To rollback:

1. **Create a new migration** that reverses the changes
2. **Or manually revert** the SQL

Example rollback migration:

```sql
-- Rollback: remove column
ALTER TABLE "Voucher" DROP COLUMN IF EXISTS "newColumn";
```

## Migration Checklist

Before deploying a migration to production:

- [ ] Migration SQL reviewed
- [ ] Tested on development database
- [ ] Tested on staging database (if available)
- [ ] Data migration script tested (if applicable)
- [ ] Backup created (production)
- [ ] Rollback plan documented
- [ ] Team notified of migration

## Common Migration Patterns

### Adding a Column

```prisma
model Voucher {
  // ... existing fields
  newField String?  // Start as nullable
}
```

Then in next migration:

```prisma
model Voucher {
  newField String  // Make required after data populated
}
```

### Renaming a Column

Prisma doesn't support rename directly. Use:

1. Add new column
2. Migrate data
3. Remove old column

Or use raw SQL:

```sql
ALTER TABLE "Voucher" RENAME COLUMN "oldName" TO "newName";
```

### Adding an Index

```prisma
model Voucher {
  // ... fields
  
  @@index([merchantId, status])  // Composite index
}
```

## Production Deployment

### Using Vercel

1. Add migration step to `package.json`:

   ```json
   {
     "scripts": {
       "postinstall": "prisma generate",
       "migrate:deploy": "prisma migrate deploy"
     }
   }
   ```

2. Run migration before deployment or in build step

### Using Docker

Add to Dockerfile:

```dockerfile
RUN npx prisma migrate deploy
```

### Manual Deployment

1. **Backup database**:

   ```bash
   pg_dump $DATABASE_URL > backup_$(date +%Y%m%d_%H%M%S).sql
   ```

2. **Apply migration**:

   ```bash
   npx prisma migrate deploy
   ```

3. **Verify**:

   ```bash
   npx prisma migrate status
   ```

## Troubleshooting

### Migration Fails

1. Check database connection
2. Verify migration SQL syntax
3. Check for conflicting migrations
4. Review Prisma migration status: `npx prisma migrate status`

### Reset Development Database

```bash
npx prisma migrate reset
```

⚠️ **WARNING**: This deletes all data!

### Resolve Migration Conflicts

If migrations are out of sync:

```bash
# Mark migrations as applied (if already applied manually)
npx prisma migrate resolve --applied migration_name

# Mark as rolled back
npx prisma migrate resolve --rolled-back migration_name
```

## Migration Files Structure

```text
prisma/
  migrations/
    20250101000000_init/
      migration.sql
    20250102000000_add_feature_flags/
      migration.sql
    20250103000000_add_campaigns/
      migration.sql
```

Each migration directory contains:

- `migration.sql` - The SQL to execute
- `migration_lock.toml` - Lock file (auto-generated)

## Next Steps

1. Convert existing schema to migrations:

   ```bash
   npx prisma migrate dev --name init
   ```

2. Set up CI/CD to run migrations automatically

3. Document rollback procedures for each migration

4. Set up database backups before migrations

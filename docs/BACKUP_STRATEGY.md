# Backup & Disaster Recovery Strategy

## Backup Strategy

### Database Backups

#### Automated Backups

On the server (set up in [DEPLOYMENT.md](../DEPLOYMENT.md), step 7):

- **Nightly:** `deploy/crontab.example` runs `sh scripts/db-backup.sh production`
  at 03:15 server time. Dumps go to `backups/production/voucher_*.sql.gz`; the
  newest 14 are kept (`BACKUP_RETENTION`).
- **Before every production deploy:** `deploy/deploy.sh` takes a
  `predeploy_*.sql.gz` dump before it runs migrations (rotated separately).
- **Staging:** no automatic backups; run the script by hand when needed.

#### Manual Backup

On the server, from the app directory (`/srv/voucher`). The script runs
`pg_dump` inside the Postgres container, since the database has no port on
the host:

```bash
sh scripts/db-backup.sh production
```

#### Backup Storage

- Store backups in:
  - S3 bucket (encrypted)
  - Separate region from production
  - Version controlled

### Application Backups

- Environment variables backed up securely
- Configuration files in version control
- Static assets (if any) in object storage with versioning

## Restoration Procedures

### Database Restoration

#### From SQL Dump

On the server ([RUNBOOK.md](../RUNBOOK.md), "Restore a database backup"): it
asks for confirmation, stops the app, replaces the database, applies
migrations and starts the app again.

```bash
sh scripts/db-restore.sh backups/production/predeploy_20260101_120000.sql.gz production
```

#### Point-in-Time Recovery

If using PostgreSQL with WAL archiving:

```bash
# Restore to specific point in time
pg_basebackup -D /backup/restore -Ft -z -P
# Then configure recovery.conf for point-in-time recovery
```

### Testing Restorations

- [ ] Test restoration monthly
- [ ] Verify data integrity after restoration
- [ ] Document restoration time (RTO)
- [ ] Test on staging first

## Disaster Recovery Plan

### RTO (Recovery Time Objective)

- **Target**: 4 hours
- **Critical systems**: 1 hour

### RPO (Recovery Point Objective)

- **Target**: 1 hour (last backup)
- **Critical data**: 15 minutes (with WAL archiving)

### Recovery Steps

1. **Assess damage**
   - Identify affected systems
   - Determine scope of data loss

2. **Notify team**
   - Alert stakeholders
   - Activate incident response

3. **Restore from backup**
   - Restore database
   - Restore application
   - Verify integrity

4. **Validate**
   - Test critical functions
   - Verify data consistency
   - Check audit logs

5. **Resume operations**
   - Monitor closely
   - Document incident

## Backup Automation

### On the server

`scripts/db-backup.sh` and the crontab above are the backup automation.
Backups on the same disk do not survive losing the server: copy
`backups/production/` elsewhere regularly (DEPLOYMENT.md, step 7, has an
`scp` example), e.g. to S3 or another machine.

### Using Managed Services

**AWS RDS:**

- Automated backups enabled
- Retention configurable
- Cross-region replication

**Supabase:**

- Daily backups included
- Point-in-time recovery (Pro plan)

## Monitoring

### Backup Health Checks

- [ ] Verify backups complete successfully
- [ ] Check backup file sizes (alert if unusually small)
- [ ] Test restoration monthly
- [ ] Monitor backup storage usage

### Alerts

Set up alerts for:

- Backup failures
- Backup storage full
- Unusual backup sizes
- Restoration test failures

## Best Practices

1. **3-2-1 Rule**
   - 3 copies of data
   - 2 different media types
   - 1 off-site backup

2. **Encryption**
   - Encrypt backups at rest
   - Encrypt backups in transit

3. **Testing**
   - Regular restoration tests
   - Document procedures
   - Train team

4. **Documentation**
   - Keep backup procedures documented
   - Update regularly
   - Include contact information

## Implementation Checklist

- [ ] Set up automated daily backups
- [ ] Configure backup retention
- [ ] Set up off-site backup storage
- [ ] Test restoration procedure
- [ ] Document recovery procedures
- [ ] Set up backup monitoring/alerts
- [ ] Schedule monthly restoration tests
- [ ] Train team on recovery procedures

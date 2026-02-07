# Backup & Disaster Recovery Strategy

## Backup Strategy

### Database Backups

#### Automated Backups

**Production:**

- Daily full backups at 2 AM UTC
- Retain 7 daily backups
- Retain 4 weekly backups
- Retain 12 monthly backups

**Staging:**

- Daily full backups
- Retain 3 daily backups

#### Manual Backup

```bash
# Full database backup
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d_%H%M%S).sql

# Compressed backup
pg_dump $DATABASE_URL | gzip > backup_$(date +%Y%m%d_%H%M%S).sql.gz
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

```bash
# Restore from backup
psql $DATABASE_URL < backup_20250101_020000.sql

# Or from compressed
gunzip < backup_20250101_020000.sql.gz | psql $DATABASE_URL
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

### Using pg_dump with cron

```bash
#!/bin/bash
# backup.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups"
DB_URL="$DATABASE_URL"

# Create backup
pg_dump $DB_URL | gzip > $BACKUP_DIR/backup_$DATE.sql.gz

# Upload to S3
aws s3 cp $BACKUP_DIR/backup_$DATE.sql.gz s3://backups-bucket/

# Cleanup old local backups (keep last 7)
find $BACKUP_DIR -name "backup_*.sql.gz" -mtime +7 -delete
```

### Using Managed Services

**Vercel Postgres:**

- Automatic daily backups
- Point-in-time recovery available

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

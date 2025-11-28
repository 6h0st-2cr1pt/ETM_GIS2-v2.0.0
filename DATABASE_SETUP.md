# PostgreSQL Database Setup Guide

This guide covers setting up PostgreSQL database for the ETM_GIS2 application on Hostinger KVM 2.

## Quick Setup

### Option 1: Automated Setup Script

```bash
chmod +x setup_postgres.sh
./setup_postgres.sh
```

The script will:
- Create PostgreSQL database
- Create database user with secure password
- Set proper encoding and timezone
- Grant necessary privileges
- Test the connection

### Option 2: Manual Setup

#### Step 1: Install PostgreSQL (if not already installed)

```bash
sudo apt update
sudo apt install postgresql postgresql-contrib -y
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

#### Step 2: Create Database and User

```bash
sudo -u postgres psql
```

In PostgreSQL prompt, run:

```sql
-- Create database user
CREATE USER etm_user WITH PASSWORD 'your_secure_password_here';

-- Create database
CREATE DATABASE endemic_trees OWNER etm_user;

-- Set encoding and timezone
ALTER DATABASE endemic_trees SET client_encoding TO 'utf8';
ALTER DATABASE endemic_trees SET default_transaction_isolation TO 'read committed';
ALTER DATABASE endemic_trees SET timezone TO 'UTC';

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE endemic_trees TO etm_user;

-- Connect to database and grant schema privileges
\c endemic_trees
GRANT ALL ON SCHEMA public TO etm_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO etm_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO etm_user;

-- Exit
\q
```

#### Step 3: Test Connection

```bash
psql -h localhost -U etm_user -d endemic_trees
```

Enter the password when prompted. If successful, you'll see the PostgreSQL prompt.

## Configuration

### Environment Variables

Add these to your `.env` file:

```env
# Database Configuration
DB_NAME=endemic_trees
DB_USER=etm_user
DB_PASSWORD=your_secure_password_here
DB_HOST=localhost
DB_PORT=5432

# Optional: Connection Settings
DB_CONN_MAX_AGE=600  # Connection max age in seconds (10 minutes)
DB_USE_POOLING=False  # Set to True if using PgBouncer
```

### PostgreSQL Configuration Files

#### 1. postgresql.conf (Performance Tuning)

Edit `/etc/postgresql/*/main/postgresql.conf`:

```conf
# Memory settings (adjust based on your VPS RAM)
shared_buffers = 256MB          # 25% of RAM for small VPS
effective_cache_size = 1GB      # 50-75% of RAM
maintenance_work_mem = 128MB
work_mem = 4MB

# Connection settings
max_connections = 100
listen_addresses = 'localhost'

# Logging
logging_collector = on
log_directory = 'log'
log_filename = 'postgresql-%Y-%m-%d.log'
log_statement = 'mod'  # Log all modifications
log_min_duration_statement = 1000  # Log slow queries (>1 second)
```

#### 2. pg_hba.conf (Authentication)

Edit `/etc/postgresql/*/main/pg_hba.conf`:

```
# TYPE  DATABASE        USER            ADDRESS                 METHOD
local   all             all                                     peer
host    all             all             127.0.0.1/32            md5
host    all             all             ::1/128                 md5
```

**Important**: For production, only allow localhost connections unless you need remote access.

### Restart PostgreSQL

After making changes:

```bash
sudo systemctl restart postgresql
```

## Security Best Practices

### 1. Use Strong Passwords

Generate a strong password:
```bash
openssl rand -base64 32
```

### 2. Limit User Privileges

Only grant necessary privileges:
```sql
-- Don't grant superuser privileges
-- Only grant what's needed for the application
GRANT CONNECT ON DATABASE endemic_trees TO etm_user;
GRANT USAGE ON SCHEMA public TO etm_user;
```

### 3. Regular Backups

Set up automated backups:

```bash
# Create backup script
sudo nano /usr/local/bin/backup_db.sh
```

Add:
```bash
#!/bin/bash
BACKUP_DIR="/var/backups/postgresql"
DATE=$(date +%Y%m%d_%H%M%S)
DB_NAME="endemic_trees"
DB_USER="etm_user"

mkdir -p $BACKUP_DIR
sudo -u postgres pg_dump -U $DB_USER $DB_NAME | gzip > $BACKUP_DIR/${DB_NAME}_${DATE}.sql.gz

# Keep only last 7 days
find $BACKUP_DIR -name "${DB_NAME}_*.sql.gz" -mtime +7 -delete
```

Make executable:
```bash
sudo chmod +x /usr/local/bin/backup_db.sh
```

Add to crontab (daily at 2 AM):
```bash
sudo crontab -e
# Add:
0 2 * * * /usr/local/bin/backup_db.sh
```

## Performance Optimization

### 1. Connection Pooling (Optional)

For high-traffic sites, consider using PgBouncer:

```bash
sudo apt install pgbouncer -y
```

Configure `/etc/pgbouncer/pgbouncer.ini`:
```ini
[databases]
endemic_trees = host=localhost port=5432 dbname=endemic_trees

[pgbouncer]
pool_mode = transaction
max_client_conn = 100
default_pool_size = 20
```

### 2. Index Optimization

After running migrations, check for missing indexes:

```sql
-- Connect to database
\c endemic_trees

-- Check table sizes
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

### 3. Vacuum and Analyze

Schedule regular maintenance:

```bash
# Add to crontab
sudo crontab -e
# Add (weekly on Sunday at 3 AM):
0 3 * * 0 sudo -u postgres psql -d endemic_trees -c "VACUUM ANALYZE;"
```

## Troubleshooting

### Connection Refused

```bash
# Check if PostgreSQL is running
sudo systemctl status postgresql

# Check if it's listening
sudo netstat -tlnp | grep 5432
```

### Authentication Failed

1. Check `pg_hba.conf` configuration
2. Verify user exists: `sudo -u postgres psql -c "\du"`
3. Reset password: `sudo -u postgres psql -c "ALTER USER etm_user WITH PASSWORD 'new_password';"`

### Permission Denied

```sql
-- Grant necessary privileges
\c endemic_trees
GRANT ALL ON SCHEMA public TO etm_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO etm_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO etm_user;
```

### Database Connection Timeout

1. Check PostgreSQL is running: `sudo systemctl status postgresql`
2. Check firewall: `sudo ufw status`
3. Verify connection settings in `.env`
4. Test connection: `psql -h localhost -U etm_user -d endemic_trees`

## Migration Commands

After setting up the database:

```bash
# Activate virtual environment
source venv/bin/activate

# Run migrations
python manage.py makemigrations
python manage.py migrate

# Create superuser
python manage.py createsuperuser

# Load initial data (if available)
python manage.py loaddata initial_data.json  # if you have fixtures
```

## Monitoring

### Check Database Size

```sql
SELECT pg_size_pretty(pg_database_size('endemic_trees'));
```

### Check Active Connections

```sql
SELECT count(*) FROM pg_stat_activity WHERE datname = 'endemic_trees';
```

### Check Slow Queries

Enable in `postgresql.conf`:
```conf
log_min_duration_statement = 1000  # Log queries > 1 second
```

View logs:
```bash
sudo tail -f /var/log/postgresql/postgresql-*.log
```

## Backup and Restore

### Backup

```bash
# Full backup
sudo -u postgres pg_dump endemic_trees > backup_$(date +%Y%m%d).sql

# Compressed backup
sudo -u postgres pg_dump endemic_trees | gzip > backup_$(date +%Y%m%d).sql.gz
```

### Restore

```bash
# From SQL file
sudo -u postgres psql endemic_trees < backup_20240101.sql

# From compressed file
gunzip < backup_20240101.sql.gz | sudo -u postgres psql endemic_trees
```

**Warning**: Restoring will overwrite existing data!

## Production Checklist

- [ ] PostgreSQL installed and running
- [ ] Database and user created
- [ ] Strong password set
- [ ] Environment variables configured in `.env`
- [ ] Migrations run successfully
- [ ] Superuser created
- [ ] Backups configured
- [ ] Firewall configured (only localhost access)
- [ ] Performance tuning applied
- [ ] Monitoring set up
- [ ] Connection tested

---

For more information, see the main [DEPLOYMENT.md](DEPLOYMENT.md) guide.


# Updating Your Application on Hostinger VPS

This guide explains how to update your ETM_GIS2 application on Hostinger VPS when you push changes to GitHub.

## Quick Update (Recommended)

### Option 1: Using the Update Script (Easiest)

```bash
# SSH into your VPS
ssh root@72.60.192.148

# Navigate to project directory
cd /var/www/ETM_GIS2-v2.0.0

# Make script executable (first time only)
chmod +x update.sh

# Run update script
./update.sh
```

The script will:
1. ✅ Pull latest changes from GitHub
2. ✅ Create a backup
3. ✅ Update Python dependencies
4. ✅ Run database migrations
5. ✅ Collect static files
6. ✅ Restart the application service
7. ✅ Reload Nginx

### Option 2: Manual Update (Step by Step)

```bash
# 1. SSH into your VPS
ssh root@72.60.192.148

# 2. Navigate to project directory
cd /var/www/ETM_GIS2-v2.0.0

# 3. Pull latest changes
git pull origin main

# 4. Activate virtual environment
source venv/bin/activate

# 5. Update dependencies (if requirements.txt changed)
pip install -r requirements.txt

# 6. Run migrations (if database changes)
python manage.py migrate

# 7. Collect static files (if static files changed)
python manage.py collectstatic --noinput

# 8. Restart application
systemctl restart endemic_trees

# 9. Reload Nginx (optional, usually not needed)
systemctl reload nginx
```

## Update Workflow

### Typical Workflow:

1. **Make changes locally** on your development machine
2. **Test changes** locally
3. **Commit and push to GitHub:**
   ```bash
   git add .
   git commit -m "Your commit message"
   git push origin main
   ```
4. **SSH into VPS** and run update script:
   ```bash
   ssh root@72.60.192.148
   cd /var/www/ETM_GIS2-v2.0.0
   ./update.sh
   ```

## What Gets Updated?

### Code Changes
- ✅ Python files (`.py`)
- ✅ Templates (`.html`)
- ✅ Static files (CSS, JS, images)
- ✅ Configuration files

### Database Changes
- ✅ New migrations are automatically applied
- ✅ Database schema is updated

### Dependencies
- ✅ New packages from `requirements.txt` are installed
- ✅ Updated packages are upgraded

## Update Scenarios

### Scenario 1: Code Changes Only (No Database Changes)

```bash
cd /var/www/ETM_GIS2-v2.0.0
git pull origin main
systemctl restart endemic_trees
```

### Scenario 2: Code + Database Changes

```bash
cd /var/www/ETM_GIS2-v2.0.0
git pull origin main
source venv/bin/activate
python manage.py migrate
python manage.py collectstatic --noinput
systemctl restart endemic_trees
```

### Scenario 3: Code + New Dependencies

```bash
cd /var/www/ETM_GIS2-v2.0.0
git pull origin main
source venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
python manage.py collectstatic --noinput
systemctl restart endemic_trees
```

### Scenario 4: Full Update (Use Update Script)

```bash
cd /var/www/ETM_GIS2-v2.0.0
./update.sh
```

## Automated Updates (Optional)

### Using Cron for Automatic Updates

**⚠️ Warning:** Only enable this if you're comfortable with automatic updates.

```bash
# Edit crontab
crontab -e

# Add this line to check for updates every day at 3 AM
0 3 * * * cd /var/www/ETM_GIS2-v2.0.0 && /bin/bash update.sh >> /var/log/etm_update.log 2>&1
```

**Better approach:** Use a webhook or CI/CD pipeline for controlled updates.

## Rollback (If Something Goes Wrong)

### Option 1: Restore from Backup

The update script creates backups automatically. To restore:

```bash
# List backups
ls -lh /var/backups/etm_gis2/

# Restore from backup
cd /var/www/ETM_GIS2-v2.0.0
tar -xzf /var/backups/etm_gis2/backup_YYYYMMDD_HHMMSS.tar.gz
systemctl restart endemic_trees
```

### Option 2: Git Rollback

```bash
cd /var/www/ETM_GIS2-v2.0.0

# See commit history
git log --oneline -10

# Rollback to previous commit
git reset --hard HEAD~1

# Or rollback to specific commit
git reset --hard <commit-hash>

# Restart service
systemctl restart endemic_trees
```

### Option 3: Revert Database Migration

```bash
cd /var/www/ETM_GIS2-v2.0.0
source venv/bin/activate

# Rollback last migration
python manage.py migrate app zero  # Replace 'app' with your app name

# Or rollback to specific migration
python manage.py migrate app 0019  # Replace with migration number
```

## Troubleshooting Updates

### Issue: Git Pull Fails (Merge Conflicts)

```bash
# Check status
git status

# If there are conflicts, you can:
# Option 1: Stash local changes
git stash
git pull origin main
git stash pop

# Option 2: Reset to remote (WARNING: loses local changes)
git fetch origin
git reset --hard origin/main
```

### Issue: Migration Fails

```bash
# Check migration status
python manage.py showmigrations

# Check for errors
python manage.py migrate --verbosity 2

# If needed, fake migration
python manage.py migrate --fake app migration_name
```

### Issue: Service Won't Start After Update

```bash
# Check service status
systemctl status endemic_trees

# Check logs
journalctl -u endemic_trees -n 100

# Check for syntax errors
python manage.py check

# Test Gunicorn manually
cd /var/www/ETM_GIS2-v2.0.0
source venv/bin/activate
gunicorn --config gunicorn_config.py endemic_trees.wsgi:application
```

### Issue: Static Files Not Updating

```bash
# Force collect static files
python manage.py collectstatic --noinput --clear

# Check Nginx configuration
nginx -t

# Restart Nginx
systemctl restart nginx
```

## Best Practices

### 1. Always Test Locally First
- Test changes on your development machine
- Run migrations locally
- Check for errors

### 2. Commit Often, Update Carefully
- Make small, frequent commits
- Update production during low-traffic periods
- Keep backups

### 3. Monitor After Updates
```bash
# Watch logs in real-time
journalctl -u endemic_trees -f

# Check application status
systemctl status endemic_trees

# Monitor system resources
htop
```

### 4. Use Git Tags for Releases
```bash
# Tag a release
git tag -a v1.0.0 -m "Release version 1.0.0"
git push origin v1.0.0

# Deploy specific version
git checkout v1.0.0
./update.sh
```

## Quick Reference Commands

```bash
# Quick update (one-liner)
cd /var/www/ETM_GIS2-v2.0.0 && git pull && source venv/bin/activate && pip install -r requirements.txt && python manage.py migrate && python manage.py collectstatic --noinput && systemctl restart endemic_trees

# Check what changed
cd /var/www/ETM_GIS2-v2.0.0
git log --oneline -5
git diff HEAD~1 HEAD

# View recent commits
git log --oneline --graph -10

# Check service status
systemctl status endemic_trees nginx postgresql

# View logs
journalctl -u endemic_trees -n 50 --no-pager
```

## Update Checklist

Before updating:
- [ ] Tested changes locally
- [ ] Committed and pushed to GitHub
- [ ] Backup created (automatic with update.sh)
- [ ] Low-traffic period (if possible)

After updating:
- [ ] Check service status: `systemctl status endemic_trees`
- [ ] Check application in browser
- [ ] Review logs for errors
- [ ] Test critical functionality
- [ ] Monitor for a few minutes

---

**Pro Tip:** Create an alias for quick updates:

```bash
# Add to ~/.bashrc
alias update-etm='cd /var/www/ETM_GIS2-v2.0.0 && ./update.sh'

# Then just run:
update-etm
```


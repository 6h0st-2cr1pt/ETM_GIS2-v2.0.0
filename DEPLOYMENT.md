# Deployment Guide for Hostinger KVM 2

This guide will help you deploy the ETM_GIS2 Django application on a Hostinger KVM 2 VPS.

## Prerequisites

- Hostinger KVM 2 VPS (Ubuntu 20.04/22.04 recommended)
- Domain name pointing to your VPS IP
- SSH access to your VPS
- Basic knowledge of Linux commands

## Step 1: Initial Server Setup

### 1.1 Update System Packages

```bash
sudo apt update
sudo apt upgrade -y
```

### 1.2 Install Required Software

```bash
# Install Python 3.10+ and pip
sudo apt install python3 python3-pip python3-venv -y

# Install PostgreSQL
sudo apt install postgresql postgresql-contrib -y

# Install Nginx
sudo apt install nginx -y

# Install Git
sudo apt install git -y

# Install other dependencies
sudo apt install build-essential libpq-dev python3-dev -y
```

## Step 2: Database Setup

### 2.1 Create PostgreSQL Database and User

```bash
sudo -u postgres psql
```

In PostgreSQL prompt:
```sql
CREATE DATABASE endemic_trees;
CREATE USER your_db_user WITH PASSWORD 'your_secure_password';
ALTER ROLE your_db_user SET client_encoding TO 'utf8';
ALTER ROLE your_db_user SET default_transaction_isolation TO 'read committed';
ALTER ROLE your_db_user SET timezone TO 'UTC';
GRANT ALL PRIVILEGES ON DATABASE endemic_trees TO your_db_user;
\q
```

### 2.2 Configure PostgreSQL (Optional - for remote access)

Edit `/etc/postgresql/*/main/postgresql.conf`:
```
listen_addresses = 'localhost'
```

Edit `/etc/postgresql/*/main/pg_hba.conf`:
```
local   all             all                                     peer
host    all             all             127.0.0.1/32            md5
```

Restart PostgreSQL:
```bash
sudo systemctl restart postgresql
```

## Step 3: Deploy Application

### 3.1 Clone Repository

```bash
cd /var/www
sudo git clone https://github.com/yourusername/ETM_GIS2-v2.0.0.git
sudo chown -R $USER:$USER ETM_GIS2-v2.0.0
cd ETM_GIS2-v2.0.0
```

### 3.2 Create Virtual Environment

```bash
python3 -m venv venv
source venv/bin/activate
```

### 3.3 Install Dependencies

```bash
pip install --upgrade pip
pip install -r requirements.txt
```

### 3.4 Configure Environment Variables

```bash
cp env.example .env
nano .env
```

Update `.env` with your production settings:
```env
# Django Settings
DEBUG=False
SECRET_KEY=your-very-long-random-secret-key-here-generate-with-openssl-rand-hex-32
ALLOWED_HOSTS=your-domain.com,www.your-domain.com,your-server-ip

# Database Configuration
DB_NAME=endemic_trees
DB_USER=your_db_user
DB_PASSWORD=your_secure_password
DB_HOST=localhost
DB_PORT=5432

# Optional: Gunicorn Settings
GUNICORN_PORT=8000
GUNICORN_WORKERS=3
```

**Generate a secure SECRET_KEY:**
```bash
python -c 'from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())'
```

### 3.5 Run Migrations

```bash
python manage.py makemigrations
python manage.py migrate
```

### 3.6 Create Superuser

```bash
python manage.py createsuperuser
```

### 3.7 Collect Static Files

```bash
python manage.py collectstatic --noinput
```

## Step 4: Configure Gunicorn

### 4.1 Test Gunicorn

```bash
gunicorn --config gunicorn_config.py endemic_trees.wsgi:application
```

If it works, press `Ctrl+C` to stop.

### 4.2 Create Systemd Service

```bash
sudo nano /etc/systemd/system/endemic_trees.service
```

Copy the content from `endemic_trees.service.example` and update paths:
- Replace `/path/to/your/project/ETM_GIS2-v2.0.0` with `/var/www/ETM_GIS2-v2.0.0`
- Replace `/path/to/your/venv/bin` with `/var/www/ETM_GIS2-v2.0.0/venv/bin`

### 4.3 Start and Enable Service

```bash
sudo systemctl daemon-reload
sudo systemctl start endemic_trees
sudo systemctl enable endemic_trees
sudo systemctl status endemic_trees
```

## Step 5: Configure Nginx

### 5.1 Create Nginx Configuration

```bash
sudo nano /etc/nginx/sites-available/endemic_trees
```

Copy content from `nginx.conf.example` and update:
- Replace `your-domain.com` with your actual domain
- Replace `/path/to/your/project/` with `/var/www/ETM_GIS2-v2.0.0/`

### 5.2 Enable Site

```bash
sudo ln -s /etc/nginx/sites-available/endemic_trees /etc/nginx/sites-enabled/
sudo nginx -t  # Test configuration
sudo systemctl restart nginx
```

## Step 6: Firewall Configuration

```bash
# Allow SSH (if not already allowed)
sudo ufw allow 22/tcp

# Allow HTTP
sudo ufw allow 80/tcp

# Allow HTTPS (if using SSL)
sudo ufw allow 443/tcp

# Enable firewall
sudo ufw enable
```

## Step 7: SSL Certificate (Optional but Recommended)

### Using Let's Encrypt (Free SSL)

```bash
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d your-domain.com -d www.your-domain.com
```

Certbot will automatically configure Nginx for SSL.

## Step 8: Final Checks

### 8.1 Check Services Status

```bash
sudo systemctl status endemic_trees
sudo systemctl status nginx
sudo systemctl status postgresql
```

### 8.2 Check Logs

```bash
# Gunicorn logs
sudo journalctl -u endemic_trees -f

# Nginx logs
sudo tail -f /var/log/nginx/endemic_trees_error.log
sudo tail -f /var/log/nginx/endemic_trees_access.log

# Django logs (if configured)
tail -f /var/www/ETM_GIS2-v2.0.0/logs/django.log
```

## Step 9: Maintenance Commands

### Restart Application

```bash
sudo systemctl restart endemic_trees
```

### Update Application

```bash
cd /var/www/ETM_GIS2-v2.0.0
source venv/bin/activate
git pull
pip install -r requirements.txt
python manage.py migrate
python manage.py collectstatic --noinput
sudo systemctl restart endemic_trees
```

### View Application Logs

```bash
sudo journalctl -u endemic_trees -n 50
```

## Troubleshooting

### Application Not Starting

1. Check service status: `sudo systemctl status endemic_trees`
2. Check logs: `sudo journalctl -u endemic_trees -n 100`
3. Verify environment variables in `.env`
4. Check database connection: `python manage.py dbshell`

### Static Files Not Loading

1. Run: `python manage.py collectstatic --noinput`
2. Check Nginx configuration for static file paths
3. Verify file permissions: `sudo chown -R www-data:www-data staticfiles/`

### Database Connection Issues

1. Verify PostgreSQL is running: `sudo systemctl status postgresql`
2. Check database credentials in `.env`
3. Test connection: `psql -U your_db_user -d endemic_trees -h localhost`

### 502 Bad Gateway

1. Check if Gunicorn is running: `sudo systemctl status endemic_trees`
2. Check Nginx error logs: `sudo tail -f /var/log/nginx/error.log`
3. Verify Gunicorn is listening on correct port

## Security Recommendations

1. **Change default SSH port** (optional but recommended)
2. **Use strong passwords** for database and Django admin
3. **Enable SSL/HTTPS** with Let's Encrypt
4. **Keep system updated**: `sudo apt update && sudo apt upgrade`
5. **Regular backups** of database and media files
6. **Monitor logs** regularly for suspicious activity
7. **Use firewall** (UFW) to restrict access
8. **Disable root login** via SSH (if possible)

## Backup Strategy

### Database Backup

```bash
# Create backup
sudo -u postgres pg_dump endemic_trees > backup_$(date +%Y%m%d).sql

# Restore backup
sudo -u postgres psql endemic_trees < backup_20240101.sql
```

### Media Files Backup

```bash
tar -czf media_backup_$(date +%Y%m%d).tar.gz /var/www/ETM_GIS2-v2.0.0/media/
```

## Performance Optimization

1. **Enable Gunicorn workers**: Adjust `GUNICORN_WORKERS` in `.env`
2. **Use Nginx caching** for static files
3. **Enable PostgreSQL connection pooling** (PgBouncer)
4. **Use CDN** for static assets (optional)
5. **Monitor resource usage**: `htop`, `df -h`

## Support

For issues or questions:
- Check Django logs
- Review Nginx error logs
- Check system resources
- Verify all services are running

---

**Note**: Replace all placeholder values (your-domain.com, paths, passwords) with your actual values before deployment.


# Quick Start Guide for Hostinger KVM 2 VPS

**Your VPS Details:**
- OS: Ubuntu 24.04 LTS
- IP: 72.60.192.148
- SSH User: root
- Resources: 2 CPU, 8 GB RAM, 100 GB Disk

## Step 1: Initial Setup (SSH as root)

### 1.1 Update System

```bash
apt update
apt upgrade -y
```

### 1.2 Install Required Software

```bash
# Install Python 3.12+ (Ubuntu 24.04 comes with Python 3.12)
apt install python3 python3-pip python3-venv -y

# Install PostgreSQL
apt install postgresql postgresql-contrib -y

# Install Nginx
apt install nginx -y

# Install Git
apt install git -y

# Install build dependencies
apt install build-essential libpq-dev python3-dev -y
```

### 1.3 (Optional) Create Non-Root User (Recommended for Security)

```bash
# Create a new user
adduser etm_user
usermod -aG sudo etm_user

# Switch to new user
su - etm_user
```

**Note:** If you continue as root, you can skip `sudo` in all commands below.

## Step 2: Database Setup

### Option A: Using Setup Script (Recommended)

```bash
# Download the setup script (if you've cloned the repo)
cd /root  # or /home/etm_user if using non-root user
chmod +x setup_postgres.sh

# Run the script (it will prompt for details)
./setup_postgres.sh
```

### Option B: Manual Setup

```bash
# Connect to PostgreSQL
su - postgres
psql

# In PostgreSQL prompt:
CREATE USER etm_user WITH PASSWORD 'your_secure_password_here';
CREATE DATABASE endemic_trees OWNER etm_user;
ALTER DATABASE endemic_trees SET client_encoding TO 'utf8';
ALTER DATABASE endemic_trees SET timezone TO 'UTC';
GRANT ALL PRIVILEGES ON DATABASE endemic_trees TO etm_user;
\c endemic_trees
GRANT ALL ON SCHEMA public TO etm_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO etm_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO etm_user;
\q
exit
```

## Step 3: Deploy Application

### 3.1 Clone Repository

```bash
cd /var/www
git clone https://github.com/6h0st-2cr1pt/ETM_GIS2-v2.0.0.git
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

**Update `.env` with these values:**

```env
# Django Settings
DEBUG=False
SECRET_KEY=generate-with-command-below
ALLOWED_HOSTS=72.60.192.148,your-domain.com,www.your-domain.com

# Database Configuration
DB_NAME=endemic_trees
DB_USER=etm_user
DB_PASSWORD=your_secure_password_here
DB_HOST=localhost
DB_PORT=5432

# Gunicorn Settings
GUNICORN_PORT=8000
GUNICORN_WORKERS=3
```

**Generate SECRET_KEY:**
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

Press `Ctrl+C` to stop after testing.

### 4.2 Create Systemd Service

```bash
nano /etc/systemd/system/endemic_trees.service
```

**Paste this content (update paths if needed):**

```ini
[Unit]
Description=ETM_GIS2 Django application (Gunicorn)
After=network.target postgresql.service

[Service]
User=root
Group=root
WorkingDirectory=/var/www/ETM_GIS2-v2.0.0
Environment="PATH=/var/www/ETM_GIS2-v2.0.0/venv/bin"
Environment="DJANGO_SETTINGS_MODULE=endemic_trees.settings"
ExecStart=/var/www/ETM_GIS2-v2.0.0/venv/bin/gunicorn \
    --config gunicorn_config.py \
    endemic_trees.wsgi:application

Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

**If using non-root user, change User/Group:**
```ini
User=etm_user
Group=etm_user
```

### 4.3 Start Service

```bash
systemctl daemon-reload
systemctl start endemic_trees
systemctl enable endemic_trees
systemctl status endemic_trees
```

## Step 5: Configure Nginx

### 5.1 Create Nginx Configuration

```bash
nano /etc/nginx/sites-available/endemic_trees
```

**Paste this content:**

```nginx
upstream django {
    server 127.0.0.1:8000;
}

server {
    listen 80;
    server_name 72.60.192.148 your-domain.com www.your-domain.com;

    client_max_body_size 20M;

    access_log /var/log/nginx/endemic_trees_access.log;
    error_log /var/log/nginx/endemic_trees_error.log;

    # Static files
    location /static/ {
        alias /var/www/ETM_GIS2-v2.0.0/staticfiles/;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

    # Media files
    location /media/ {
        alias /var/www/ETM_GIS2-v2.0.0/media/;
        expires 7d;
        add_header Cache-Control "public";
    }

    # Proxy to Django
    location / {
        proxy_pass http://django;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_redirect off;
    }
}
```

### 5.2 Enable Site

```bash
ln -s /etc/nginx/sites-available/endemic_trees /etc/nginx/sites-enabled/
nginx -t  # Test configuration
systemctl restart nginx
```

## Step 6: Configure Firewall

```bash
# Install UFW if not installed
apt install ufw -y

# Allow SSH
ufw allow 22/tcp

# Allow HTTP
ufw allow 80/tcp

# Allow HTTPS
ufw allow 443/tcp

# Enable firewall
ufw enable
```

## Step 7: Test Your Application

Open your browser and visit:
- `http://72.60.192.148` (or your domain if configured)

You should see your Django application!

## Step 8: SSL Certificate (Optional but Recommended)

```bash
# Install Certbot
apt install certbot python3-certbot-nginx -y

# Get SSL certificate (replace with your domain)
certbot --nginx -d your-domain.com -d www.your-domain.com
```

## Troubleshooting

### Check Service Status

```bash
systemctl status endemic_trees
systemctl status nginx
systemctl status postgresql
```

### View Logs

```bash
# Gunicorn logs
journalctl -u endemic_trees -f

# Nginx logs
tail -f /var/log/nginx/endemic_trees_error.log
```

### Test Database Connection

```bash
# Activate venv first
source /var/www/ETM_GIS2-v2.0.0/venv/bin/activate
python manage.py dbshell
```

### Restart Services

```bash
systemctl restart endemic_trees
systemctl restart nginx
```

## Quick Commands Reference

```bash
# Restart application
systemctl restart endemic_trees

# View application logs
journalctl -u endemic_trees -n 50

# Update application (EASY WAY - Use update script)
cd /var/www/ETM_GIS2-v2.0.0
chmod +x update.sh  # First time only
./update.sh

# Update application (MANUAL WAY)
cd /var/www/ETM_GIS2-v2.0.0
source venv/bin/activate
git pull origin main
pip install -r requirements.txt
python manage.py migrate
python manage.py collectstatic --noinput
systemctl restart endemic_trees
```

**📖 For detailed update instructions, see [UPDATE_GUIDE.md](UPDATE_GUIDE.md)**

## Important Notes

1. **Root Access:** Since you're using root, you can skip `sudo` in commands
2. **Security:** Consider creating a non-root user for better security
3. **IP Address:** Your IP `72.60.192.148` is already included in the Nginx config
4. **Domain:** Replace `your-domain.com` with your actual domain when you have one
5. **Python Version:** Ubuntu 24.04 comes with Python 3.12, which is perfect for Django 4.2+

## Next Steps

1. ✅ Set up domain name (if you have one)
2. ✅ Configure SSL certificate
3. ✅ Set up automated backups
4. ✅ Monitor application logs
5. ✅ Configure email settings (if needed)

---

For detailed information, see [DEPLOYMENT.md](DEPLOYMENT.md) and [DATABASE_SETUP.md](DATABASE_SETUP.md).


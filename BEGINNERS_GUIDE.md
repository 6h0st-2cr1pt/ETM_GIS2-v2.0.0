# Complete Beginner's Guide: Deploy ETM_GIS2 to Hostinger VPS

This is a step-by-step guide for complete beginners. No prior experience needed!

## 📋 What You Need

- ✅ Hostinger KVM 2 VPS (you have this!)
- ✅ Your VPS IP: `72.60.192.148`
- ✅ SSH access (username: `root`)
- ✅ Your GitHub repository: `https://github.com/6h0st-2cr1pt/ETM_GIS2-v2.0.0.git`

## 🎯 What We'll Do

1. Connect to your VPS
2. Install required software
3. Set up database
4. Deploy your application
5. Make it accessible on the internet

---

## Step 1: Connect to Your VPS

### On Windows:

1. **Open PowerShell** (Press `Windows Key + X`, then select "Windows PowerShell" or "Terminal")

2. **Connect to your VPS:**
   ```bash
   ssh root@72.60.192.148
   ```

3. **Enter your password** when prompted (you won't see the password as you type - this is normal!)

4. **You're in!** You should see something like:
   ```
   root@srv1159441:~#
   ```

**Troubleshooting:**
- If you get "command not found", install OpenSSH or use PuTTY
- If connection fails, check your VPS is running in Hostinger panel

---

## Step 2: Update Your Server

First, let's make sure everything is up to date:

```bash
apt update
apt upgrade -y
```

This might take a few minutes. Wait for it to finish.

---

## Step 3: Install Required Software

We need to install several programs. Copy and paste these commands one by one:

### 3.1 Install Python and Tools

```bash
apt install python3 python3-pip python3-venv -y
```

### 3.2 Install PostgreSQL (Database)

```bash
apt install postgresql postgresql-contrib -y
```

### 3.3 Install Nginx (Web Server)

```bash
apt install nginx -y
```

### 3.4 Install Git

```bash
apt install git -y
```

### 3.5 Install Build Tools

```bash
apt install build-essential libpq-dev python3-dev -y
```

**Wait for each command to finish before running the next one!**

---

## Step 4: Set Up PostgreSQL Database

### 4.1 Create Database and User

We'll create a database for your application:

```bash
# Switch to postgres user
su - postgres

# Open PostgreSQL
psql
```

Now you're in PostgreSQL. Copy and paste these commands **one at a time**:

```sql
CREATE USER etm_user WITH PASSWORD 'ChooseASecurePassword123!';
```

**⚠️ Important:** Replace `ChooseASecurePassword123!` with your own strong password. Write it down!

Continue with:

```sql
CREATE DATABASE endemic_trees OWNER etm_user;
ALTER DATABASE endemic_trees SET client_encoding TO 'utf8';
ALTER DATABASE endemic_trees SET timezone TO 'UTC';
GRANT ALL PRIVILEGES ON DATABASE endemic_trees TO etm_user;
\c endemic_trees
GRANT ALL ON SCHEMA public TO etm_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO etm_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO etm_user;
\q
```

Exit PostgreSQL and return to root:

```bash
exit
```

You should be back to `root@srv1159441:~#`

---

## Step 5: Deploy Your Application

### 5.1 Create Project Directory

```bash
mkdir -p /var/www
cd /var/www
```

### 5.2 Clone Your Repository

```bash
git clone https://github.com/6h0st-2cr1pt/ETM_GIS2-v2.0.0.git
cd ETM_GIS2-v2.0.0
```

### 5.3 Create Virtual Environment

```bash
python3 -m venv venv
source venv/bin/activate
```

You should see `(venv)` at the beginning of your prompt now.

### 5.4 Install Python Packages

```bash
pip install --upgrade pip
pip install -r requirements.txt
```

This will take a few minutes. Be patient!

---

## Step 6: Configure Your Application

### 6.1 Create Environment File

```bash
cp env.example .env
nano .env
```

### 6.2 Edit the .env File

You'll see a text editor. Use arrow keys to navigate. Update these lines:

**Find and change these values:**

```env
DEBUG=False
SECRET_KEY=your-secret-key-here
ALLOWED_HOSTS=72.60.192.148,your-domain.com

DB_NAME=endemic_trees
DB_USER=etm_user
DB_PASSWORD=ChooseASecurePassword123!
DB_HOST=localhost
DB_PORT=5432
```

**To generate a SECRET_KEY, open a NEW terminal window, SSH again, and run:**
```bash
cd /var/www/ETM_GIS2-v2.0.0
source venv/bin/activate
python -c 'from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())'
```

Copy that long string and paste it as your SECRET_KEY.

**Important:** 
- Replace `ChooseASecurePassword123!` with the password you used in Step 4.1
- Replace `your-domain.com` with your actual domain (or just keep `72.60.192.148` if no domain)

**To save and exit nano:**
- Press `Ctrl + X`
- Press `Y` to confirm
- Press `Enter` to save

---

## Step 7: Set Up Database

### 7.1 Run Migrations

```bash
# Make sure you're in the project directory and venv is activated
cd /var/www/ETM_GIS2-v2.0.0
source venv/bin/activate

# Run migrations
python manage.py makemigrations
python manage.py migrate
```

### 7.2 Create Admin User

```bash
python manage.py createsuperuser
```

You'll be asked for:
- Username: (choose one, e.g., `admin`)
- Email: (your email)
- Password: (choose a strong password)
- Password confirmation: (type it again)

**Write down these credentials!**

### 7.3 Collect Static Files

```bash
python manage.py collectstatic --noinput
```

---

## Step 8: Configure Gunicorn (Application Server)

### 8.1 Test Gunicorn

```bash
gunicorn --config gunicorn_config.py endemic_trees.wsgi:application
```

You should see it start. Press `Ctrl + C` to stop it.

### 8.2 Create System Service

```bash
nano /etc/systemd/system/endemic_trees.service
```

**Paste this entire content:**

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

**Save and exit:** `Ctrl + X`, then `Y`, then `Enter`

### 8.3 Start the Service

```bash
systemctl daemon-reload
systemctl start endemic_trees
systemctl enable endemic_trees
systemctl status endemic_trees
```

You should see "active (running)" in green.

---

## Step 9: Configure Nginx (Web Server)

### 9.1 Create Nginx Configuration

```bash
nano /etc/nginx/sites-available/endemic_trees
```

**Paste this entire content:**

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

**Save and exit:** `Ctrl + X`, then `Y`, then `Enter`

### 9.2 Enable the Site

```bash
ln -s /etc/nginx/sites-available/endemic_trees /etc/nginx/sites-enabled/
nginx -t
```

You should see "syntax is ok" and "test is successful"

### 9.3 Start Nginx

```bash
systemctl restart nginx
systemctl status nginx
```

---

## Step 10: Configure Firewall

```bash
# Install firewall
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

---

## Step 11: Test Your Application! 🎉

Open your web browser and visit:

```
http://72.60.192.148
```

**You should see your Django application!**

### Access Admin Panel:

```
http://72.60.192.148/admin
```

Use the superuser credentials you created in Step 7.2.

---

## ✅ Checklist

- [ ] Connected to VPS via SSH
- [ ] Updated server packages
- [ ] Installed Python, PostgreSQL, Nginx
- [ ] Created database and user
- [ ] Cloned repository from GitHub
- [ ] Created virtual environment
- [ ] Installed Python packages
- [ ] Configured .env file
- [ ] Ran database migrations
- [ ] Created superuser
- [ ] Collected static files
- [ ] Created and started Gunicorn service
- [ ] Configured and started Nginx
- [ ] Opened application in browser

---

## 🔄 How to Update Your Application

When you make changes and push to GitHub:

```bash
# SSH into VPS
ssh root@72.60.192.148

# Navigate to project
cd /var/www/ETM_GIS2-v2.0.0

# Make update script executable (first time only)
chmod +x update.sh

# Run update
./update.sh
```

That's it! The script does everything automatically.

---

## 🆘 Troubleshooting

### Can't Connect via SSH

- Check your VPS is running in Hostinger panel
- Verify IP address: `72.60.192.148`
- Check firewall allows port 22

### Application Not Loading

1. **Check services are running:**
   ```bash
   systemctl status endemic_trees
   systemctl status nginx
   systemctl status postgresql
   ```

2. **Check logs:**
   ```bash
   journalctl -u endemic_trees -n 50
   tail -f /var/log/nginx/endemic_trees_error.log
   ```

3. **Restart services:**
   ```bash
   systemctl restart endemic_trees
   systemctl restart nginx
   ```

### Database Connection Error

1. **Check PostgreSQL is running:**
   ```bash
   systemctl status postgresql
   ```

2. **Verify .env file has correct database credentials**

3. **Test connection:**
   ```bash
   cd /var/www/ETM_GIS2-v2.0.0
   source venv/bin/activate
   python manage.py dbshell
   ```

### Static Files Not Loading

```bash
cd /var/www/ETM_GIS2-v2.0.0
source venv/bin/activate
python manage.py collectstatic --noinput --clear
systemctl restart endemic_trees
```

---

## 📚 Common Commands Reference

```bash
# Restart application
systemctl restart endemic_trees

# View application logs
journalctl -u endemic_trees -n 50

# View Nginx logs
tail -f /var/log/nginx/endemic_trees_error.log

# Check service status
systemctl status endemic_trees
systemctl status nginx
systemctl status postgresql

# Update application
cd /var/www/ETM_GIS2-v2.0.0
./update.sh
```

---

## 🎓 Next Steps

1. **Set up a domain name** (optional)
2. **Install SSL certificate** (free with Let's Encrypt)
3. **Set up automated backups**
4. **Monitor your application**

---

## 💡 Tips for Beginners

1. **Take your time** - Don't rush through steps
2. **Read error messages** - They usually tell you what's wrong
3. **Keep your passwords safe** - Write them down securely
4. **Test after each major step** - Don't wait until the end
5. **Use the update script** - It makes updates much easier

---

## 📞 Need Help?

- Check the logs first: `journalctl -u endemic_trees -n 100`
- Review error messages carefully
- Make sure all services are running
- Verify your .env file is correct

---

**Congratulations!** 🎉 You've deployed your Django application to production!


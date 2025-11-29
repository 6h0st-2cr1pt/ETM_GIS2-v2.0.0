# Deploy ETM_GIS2 to Render

This guide will help you deploy your Django application to Render.com - it's much easier than managing a VPS!

## 🎯 Why Render?

- ✅ **No server management** - Render handles everything
- ✅ **Automatic deployments** - Deploy from GitHub automatically
- ✅ **Free tier available** - Great for getting started
- ✅ **Built-in PostgreSQL** - Database included
- ✅ **SSL certificates** - Free HTTPS included
- ✅ **Easy scaling** - Upgrade with one click

## 📋 Prerequisites

- ✅ GitHub account
- ✅ Render account (sign up at https://render.com - it's free!)
- ✅ Your code pushed to GitHub

## 🚀 Step-by-Step Deployment

### Step 1: Sign Up for Render

1. Go to https://render.com
2. Sign up with your GitHub account (recommended)
3. Verify your email

### Step 2: Create a PostgreSQL Database

1. In Render dashboard, click **"New +"**
2. Select **"PostgreSQL"**
3. Configure:
   - **Name**: `etm-gis2-db`
   - **Database**: `endemic_trees`
   - **User**: `etm_user`
   - **Region**: Choose closest to you
   - **Plan**: Start with **Free** (upgrade later if needed)
4. Click **"Create Database"**
5. **Important**: Copy the **Internal Database URL** - you'll need it later!

### Step 3: Create a Web Service

1. In Render dashboard, click **"New +"**
2. Select **"Web Service"**
3. Connect your GitHub repository:
   - Click **"Connect GitHub"** if not already connected
   - Select your repository: `ETM_GIS2-v2.0.0`
   - Click **"Connect"**

### Step 4: Configure Web Service

Fill in the following:

**Basic Settings:**
- **Name**: `etm-gis2` (or any name you like)
- **Region**: Same as your database
- **Branch**: `main`
- **Root Directory**: (leave empty)
- **Runtime**: `Python 3`
- **Build Command**: 
  ```bash
  pip install -r requirements.txt && python manage.py collectstatic --noinput
  ```
- **Start Command**: 
  ```bash
  gunicorn endemic_trees.wsgi:application
  ```

**Environment Variables:**
Click **"Add Environment Variable"** and add these:

```
DEBUG=False
SECRET_KEY=your-very-long-random-secret-key-here
ALLOWED_HOSTS=etm-gis2.onrender.com
DATABASE_URL=<paste-your-database-internal-url-here>
```

**Important:**
- Generate SECRET_KEY: Run this locally: `python -c 'from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())'`
- For DATABASE_URL: Use the **Internal Database URL** from Step 2 (starts with `postgresql://`)
- ALLOWED_HOSTS: Replace `etm-gis2` with your actual service name

**Advanced Settings:**
- **Plan**: Start with **Free** (512 MB RAM)
- **Auto-Deploy**: Yes (deploys automatically on git push)

### Step 5: Deploy!

1. Click **"Create Web Service"**
2. Render will start building your application
3. Wait 5-10 minutes for the first deployment
4. You'll see build logs in real-time

### Step 6: Run Database Migrations

After the first deployment:

1. Go to your web service dashboard
2. Click **"Shell"** tab
3. Run:
   ```bash
   python manage.py migrate
   python manage.py createsuperuser
   ```

### Step 7: Access Your Application!

Your app will be available at:
```
https://etm-gis2.onrender.com
```

(Replace `etm-gis2` with your service name)

## 🔄 Automatic Deployments

**Good news!** Every time you push to GitHub, Render automatically:
1. Detects the change
2. Builds your application
3. Deploys the new version
4. Restarts the service

Just push to GitHub and your app updates automatically!

## 📝 Environment Variables Reference

Here are all the environment variables you can set in Render:

| Variable | Description | Example |
|----------|-------------|---------|
| `DEBUG` | Django debug mode | `False` |
| `SECRET_KEY` | Django secret key | `django-insecure-...` |
| `ALLOWED_HOSTS` | Allowed hostnames | `etm-gis2.onrender.com` |
| `DATABASE_URL` | Database connection (auto-set if linked) | `postgresql://...` |

## 🔧 Manual Deployment (Alternative)

If you prefer to use the `render.yaml` file:

1. In Render dashboard, click **"New +"**
2. Select **"Blueprint"**
3. Connect your GitHub repository
4. Render will detect `render.yaml` and use it
5. Review and click **"Apply"**

This will create both the database and web service automatically!

## 🆘 Troubleshooting

### Build Fails

**Check build logs:**
- Go to your service → **"Logs"** tab
- Look for error messages
- Common issues:
  - Missing dependencies in `requirements.txt`
  - Python version mismatch
  - Database connection errors

### Application Crashes

**Check runtime logs:**
- Go to your service → **"Logs"** tab
- Look for Python errors
- Common issues:
  - Missing environment variables
  - Database connection issues
  - Static files not collected

### Database Connection Error

1. Verify `DATABASE_URL` is set correctly
2. Make sure database is running (check database dashboard)
3. Use **Internal Database URL** (not External)
4. Check if database and web service are in same region

### Static Files Not Loading

1. Make sure `collectstatic` runs in build command
2. Verify `STATIC_ROOT` is set in settings.py
3. Check WhiteNoise is in `INSTALLED_APPS` (it is!)

### 400 Bad Request

1. Check `ALLOWED_HOSTS` includes your Render URL
2. Format: `your-service-name.onrender.com`
3. No spaces, no quotes

## 📊 Monitoring

Render provides:
- **Logs**: Real-time application logs
- **Metrics**: CPU, Memory, Request metrics
- **Alerts**: Email notifications for issues

## 💰 Pricing

**Free Tier:**
- 750 hours/month (enough for 24/7 if you have 1 service)
- 512 MB RAM
- Shared CPU
- Perfect for getting started!

**Paid Plans:**
- Starter: $7/month - 512 MB RAM, better performance
- Standard: $25/month - 2 GB RAM, dedicated resources
- Pro: Custom pricing - For high traffic

## 🔐 Security Best Practices

1. **Never commit `.env` file** - Use Render environment variables
2. **Use strong SECRET_KEY** - Generate a new one for production
3. **Set DEBUG=False** - Always in production
4. **Use HTTPS** - Render provides it automatically
5. **Regular backups** - Render can auto-backup your database

## 🎓 Next Steps

1. ✅ Set up custom domain (optional)
2. ✅ Configure email (for password resets, etc.)
3. ✅ Set up monitoring and alerts
4. ✅ Configure automated backups
5. ✅ Scale up when needed

## 📚 Useful Commands

**Via Render Shell:**
```bash
# Run migrations
python manage.py migrate

# Create superuser
python manage.py createsuperuser

# Collect static files
python manage.py collectstatic --noinput

# Django shell
python manage.py shell

# Check configuration
python manage.py check
```

## 🎉 Congratulations!

Your Django application is now live on Render! 

**Benefits you get:**
- ✅ No server management
- ✅ Automatic deployments
- ✅ Free SSL certificate
- ✅ Easy scaling
- ✅ Built-in monitoring

---

**Need Help?**
- Render Docs: https://render.com/docs
- Render Support: Available in dashboard
- Check logs first: Service → Logs tab


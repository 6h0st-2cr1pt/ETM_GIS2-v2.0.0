#!/usr/bin/env bash
# Build script for Render deployment
# This runs automatically during Render deployment

set -o errexit

echo "=== Building ETM_GIS2 Application ==="

# Upgrade pip
echo "Upgrading pip..."
pip install --upgrade pip

# Install dependencies
echo "Installing Python packages..."
pip install -r requirements.txt

# Run database migrations (for Render free tier - no shell access)
echo "Running database migrations..."
python manage.py migrate --noinput

# Collect static files
echo "Collecting static files..."
python manage.py collectstatic --noinput

echo "=== Build Complete! ==="


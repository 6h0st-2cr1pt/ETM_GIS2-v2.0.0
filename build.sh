#!/usr/bin/env bash
# Build script for Render deployment

set -o errexit

echo "Building application..."

# Install dependencies
pip install --upgrade pip
pip install -r requirements.txt

# Collect static files
echo "Collecting static files..."
python manage.py collectstatic --noinput

echo "Build complete!"


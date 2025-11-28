#!/bin/bash
# Quick deployment script for Hostinger KVM 2
# Run this script after initial server setup

set -e  # Exit on error

echo "=== ETM_GIS2 Deployment Script ==="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if running as root
if [ "$EUID" -eq 0 ]; then 
   echo -e "${RED}Please do not run as root. Use a regular user with sudo privileges.${NC}"
   exit 1
fi

# Get project directory
PROJECT_DIR=$(pwd)
VENV_DIR="$PROJECT_DIR/venv"

echo -e "${GREEN}Project directory: $PROJECT_DIR${NC}"

# Check if .env exists
if [ ! -f "$PROJECT_DIR/.env" ]; then
    echo -e "${YELLOW}Creating .env file from env.example...${NC}"
    cp env.example .env
    echo -e "${RED}IMPORTANT: Please edit .env file with your production settings before continuing!${NC}"
    echo "Press Enter to continue after editing .env..."
    read
fi

# Create virtual environment if it doesn't exist
if [ ! -d "$VENV_DIR" ]; then
    echo -e "${GREEN}Creating virtual environment...${NC}"
    python3 -m venv venv
fi

# Activate virtual environment
echo -e "${GREEN}Activating virtual environment...${NC}"
source venv/bin/activate

# Upgrade pip
echo -e "${GREEN}Upgrading pip...${NC}"
pip install --upgrade pip

# Install dependencies
echo -e "${GREEN}Installing dependencies...${NC}"
pip install -r requirements.txt

# Run migrations
echo -e "${GREEN}Running database migrations...${NC}"
python manage.py migrate

# Collect static files
echo -e "${GREEN}Collecting static files...${NC}"
python manage.py collectstatic --noinput

echo ""
echo -e "${GREEN}=== Deployment Setup Complete! ===${NC}"
echo ""
echo "Next steps:"
echo "1. Create superuser: python manage.py createsuperuser"
echo "2. Test Gunicorn: gunicorn --config gunicorn_config.py endemic_trees.wsgi:application"
echo "3. Configure systemd service (see DEPLOYMENT.md)"
echo "4. Configure Nginx (see DEPLOYMENT.md)"
echo "5. Start services: sudo systemctl start endemic_trees && sudo systemctl start nginx"
echo ""


#!/bin/bash
# Update script for ETM_GIS2 on Hostinger VPS
# This script pulls latest changes from GitHub and updates the application

set -e  # Exit on error

echo "=== ETM_GIS2 Update Script ==="
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
PROJECT_DIR="/var/www/ETM_GIS2-v2.0.0"
SERVICE_NAME="endemic_trees"
BRANCH="main"  # Change to your default branch if different

# Check if project directory exists
if [ ! -d "$PROJECT_DIR" ]; then
    echo -e "${RED}Error: Project directory not found: $PROJECT_DIR${NC}"
    echo "Please update PROJECT_DIR in this script or deploy the application first."
    exit 1
fi

cd "$PROJECT_DIR"

echo -e "${BLUE}Current directory: $(pwd)${NC}"
echo ""

# Check if git repository
if [ ! -d ".git" ]; then
    echo -e "${RED}Error: Not a git repository.${NC}"
    exit 1
fi

# Show current status
echo -e "${YELLOW}Current Git Status:${NC}"
git status --short
echo ""

# Ask for confirmation
read -p "Do you want to pull latest changes from GitHub? (y/n): " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}Update cancelled.${NC}"
    exit 0
fi

# Backup current state (optional)
echo -e "${BLUE}Creating backup...${NC}"
BACKUP_DIR="/var/backups/etm_gis2"
mkdir -p "$BACKUP_DIR"
BACKUP_FILE="$BACKUP_DIR/backup_$(date +%Y%m%d_%H%M%S).tar.gz"
tar -czf "$BACKUP_FILE" --exclude='venv' --exclude='__pycache__' --exclude='.git' . 2>/dev/null || true
echo -e "${GREEN}Backup created: $BACKUP_FILE${NC}"
echo ""

# Pull latest changes
echo -e "${GREEN}Pulling latest changes from GitHub...${NC}"
git fetch origin
git pull origin "$BRANCH"

if [ $? -ne 0 ]; then
    echo -e "${RED}Error: Failed to pull changes. Please check for conflicts.${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Successfully pulled latest changes${NC}"
echo ""

# Activate virtual environment
echo -e "${GREEN}Activating virtual environment...${NC}"
source venv/bin/activate

# Upgrade pip
echo -e "${GREEN}Upgrading pip...${NC}"
pip install --upgrade pip --quiet

# Install/update dependencies
echo -e "${GREEN}Installing/updating dependencies...${NC}"
pip install -r requirements.txt --quiet

# Run migrations
echo -e "${GREEN}Running database migrations...${NC}"
python manage.py migrate --noinput

# Collect static files
echo -e "${GREEN}Collecting static files...${NC}"
python manage.py collectstatic --noinput

# Check if there are new migrations
if [ -n "$(git diff HEAD@{1} HEAD --name-only | grep migrations)" ]; then
    echo -e "${YELLOW}New migrations detected. Make sure to review them.${NC}"
fi

# Restart application service
echo -e "${GREEN}Restarting application service...${NC}"
if systemctl is-active --quiet "$SERVICE_NAME"; then
    systemctl restart "$SERVICE_NAME"
    echo -e "${GREEN}✓ Service restarted${NC}"
else
    echo -e "${YELLOW}Warning: Service $SERVICE_NAME is not running.${NC}"
    echo "You may need to start it manually: systemctl start $SERVICE_NAME"
fi

# Reload Nginx (if needed)
if systemctl is-active --quiet nginx; then
    echo -e "${GREEN}Reloading Nginx...${NC}"
    systemctl reload nginx
    echo -e "${GREEN}✓ Nginx reloaded${NC}"
fi

echo ""
echo -e "${GREEN}=== Update Complete! ===${NC}"
echo ""
echo -e "${BLUE}Summary:${NC}"
echo "  - Latest code pulled from GitHub"
echo "  - Dependencies updated"
echo "  - Database migrations applied"
echo "  - Static files collected"
echo "  - Application service restarted"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "  1. Check application status: systemctl status $SERVICE_NAME"
echo "  2. View logs: journalctl -u $SERVICE_NAME -n 50"
echo "  3. Test your application in browser"
echo ""


#!/bin/bash
# PostgreSQL Setup Script for Hostinger KVM 2
# This script helps set up PostgreSQL database for the ETM_GIS2 application

set -e

echo "=== PostgreSQL Setup for ETM_GIS2 ==="
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Check if running as root
if [ "$EUID" -eq 0 ]; then 
   echo -e "${YELLOW}Warning: Running as root. This is OK for Hostinger VPS, but consider using a non-root user for better security.${NC}"
   echo -e "${YELLOW}Continuing with root user...${NC}"
   echo ""
   # Don't exit, just warn
fi

# Get database details
read -p "Enter database name [endemic_trees]: " DB_NAME
DB_NAME=${DB_NAME:-endemic_trees}

read -p "Enter database user [etm_user]: " DB_USER
DB_USER=${DB_USER:-etm_user}

read -sp "Enter database password: " DB_PASSWORD
echo ""

read -p "Enter database host [localhost]: " DB_HOST
DB_HOST=${DB_HOST:-localhost}

read -p "Enter database port [5432]: " DB_PORT
DB_PORT=${DB_PORT:-5432}

echo ""
echo -e "${GREEN}Creating PostgreSQL database and user...${NC}"

# Create database and user
# Use sudo if not root, otherwise run directly
if [ "$EUID" -eq 0 ]; then
    # Running as root
    su - postgres <<PSQL_EOF
psql <<SQL_EOF
-- Create user
CREATE USER ${DB_USER} WITH PASSWORD '${DB_PASSWORD}';

-- Create database
CREATE DATABASE ${DB_NAME} OWNER ${DB_USER};

-- Set encoding
ALTER DATABASE ${DB_NAME} SET client_encoding TO 'utf8';
ALTER DATABASE ${DB_NAME} SET default_transaction_isolation TO 'read committed';
ALTER DATABASE ${DB_NAME} SET timezone TO 'UTC';

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE ${DB_NAME} TO ${DB_USER};

-- Connect to database and grant schema privileges
\c ${DB_NAME}
GRANT ALL ON SCHEMA public TO ${DB_USER};
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO ${DB_USER};
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO ${DB_USER};

\q
SQL_EOF
PSQL_EOF
else
    # Running as regular user
    sudo -u postgres psql <<EOF
-- Create user
CREATE USER ${DB_USER} WITH PASSWORD '${DB_PASSWORD}';

-- Create database
CREATE DATABASE ${DB_NAME} OWNER ${DB_USER};

-- Set encoding
ALTER DATABASE ${DB_NAME} SET client_encoding TO 'utf8';
ALTER DATABASE ${DB_NAME} SET default_transaction_isolation TO 'read committed';
ALTER DATABASE ${DB_NAME} SET timezone TO 'UTC';

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE ${DB_NAME} TO ${DB_USER};

-- Connect to database and grant schema privileges
\c ${DB_NAME}
GRANT ALL ON SCHEMA public TO ${DB_USER};
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO ${DB_USER};
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO ${DB_USER};

\q
EOF
fi

echo ""
echo -e "${GREEN}Database and user created successfully!${NC}"
echo ""
echo -e "${YELLOW}Database Configuration:${NC}"
echo "  Database Name: ${DB_NAME}"
echo "  Database User: ${DB_USER}"
echo "  Database Host: ${DB_HOST}"
echo "  Database Port: ${DB_PORT}"
echo ""
echo -e "${YELLOW}Add these to your .env file:${NC}"
echo "DB_NAME=${DB_NAME}"
echo "DB_USER=${DB_USER}"
echo "DB_PASSWORD=${DB_PASSWORD}"
echo "DB_HOST=${DB_HOST}"
echo "DB_PORT=${DB_PORT}"
echo ""
echo -e "${GREEN}Testing database connection...${NC}"

# Test connection
PGPASSWORD=${DB_PASSWORD} psql -h ${DB_HOST} -p ${DB_PORT} -U ${DB_USER} -d ${DB_NAME} -c "SELECT version();" > /dev/null 2>&1

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Database connection successful!${NC}"
else
    echo -e "${RED}✗ Database connection failed. Please check your credentials.${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}Setup complete!${NC}"


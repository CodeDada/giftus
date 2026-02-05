#!/bin/bash

# Giftus Deployment Script
# This script pulls the latest code from GitHub and restarts all services
# Usage: ./deploy.sh

set -e  # Exit on error

# Set dotnet path explicitly
export PATH="/root/.dotnet:$PATH"
export DOTNET_ROOT="/root/.dotnet"

BLUE='\033[0;34m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  Giftus Deployment Script${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Check if running as root
if [[ $EUID -ne 0 ]]; then
   echo -e "${RED}❌ This script must be run as root${NC}"
   echo "Use: sudo ./deploy.sh"
   exit 1
fi

# Verify dotnet is available
if ! command -v dotnet &> /dev/null; then
    echo -e "${RED}❌ dotnet command not found${NC}"
    echo "Please ensure .NET SDK is installed"
    exit 1
fi

# Define paths
PROJECT_PATH="/home/giftus"
API_PATH="$PROJECT_PATH/giftusApi"
UI_PATH="$PROJECT_PATH/giftusUI"
API_PUBLISH_PATH="/var/www/giftus-api"

# Step 1: Pull latest code
echo -e "${YELLOW}[1/6] Pulling latest code from GitHub...${NC}"
cd "$PROJECT_PATH"

# Reset any local changes that conflict with the pull
echo "  - Resetting local changes..."
git reset --hard HEAD
git clean -fd

# Force fetch and reset to origin
git fetch origin main
git reset --hard origin/main

# Pull latest code
git pull origin main
echo -e "${GREEN}✅ Code pulled successfully${NC}"
echo ""

# Step 2: Deploy API
echo -e "${YELLOW}[2/6] Deploying .NET API...${NC}"
cd "$API_PATH"

# Verify the .csproj is correct
echo "  - Verifying project file..."
if grep -q "EnableDefaultRazorContentItems" giftusApi.csproj; then
    echo "    ✅ Project file is correct"
else
    echo "    ⚠️  Warning: Project file may not be the latest version"
fi

echo "  - Aggressive cleanup of build artifacts..."
rm -rf bin obj "$API_PUBLISH_PATH"/* .vs .vscode .vs/
dotnet clean giftusApi.csproj --verbosity quiet 2>/dev/null || true
# Clear nuget cache for this project
rm -rf ~/.nuget/packages/ 2>/dev/null || true

echo "  - Restoring dependencies (this may take 1-2 minutes)..."
dotnet restore giftusApi.csproj --verbosity quiet

echo "  - Building project..."
dotnet build giftusApi.csproj -c Release --verbosity quiet

echo "  - Publishing to $API_PUBLISH_PATH..."
dotnet publish -c Release -o "$API_PUBLISH_PATH" giftusApi.csproj --verbosity quiet
echo -e "${GREEN}✅ API deployed successfully${NC}"
echo ""

# Step 3: Restart API
echo -e "${YELLOW}[3/6] Restarting API service...${NC}"
systemctl restart giftus-api
sleep 2

# Check if API is running
if systemctl is-active --quiet giftus-api; then
    echo -e "${GREEN}✅ API service running${NC}"
else
    echo -e "${RED}❌ API service failed to start${NC}"
    systemctl status giftus-api
    exit 1
fi
echo ""

# Step 4: Deploy UI
echo -e "${YELLOW}[4/6] Deploying Next.js UI...${NC}"
cd "$UI_PATH"
echo "  - Installing dependencies..."
npm install --quiet
echo "  - Building production bundle (this may take 2-3 minutes)..."
export NEXT_PUBLIC_API_URL=https://www.trophybazaar.in
npm run build --quiet
echo -e "${GREEN}✅ UI built successfully${NC}"
echo ""

# Step 5: Restart UI
echo -e "${YELLOW}[5/6] Restarting UI service...${NC}"
systemctl restart giftus-ui
sleep 2

# Check if UI is running
if systemctl is-active --quiet giftus-ui; then
    echo -e "${GREEN}✅ UI service running${NC}"
else
    echo -e "${RED}❌ UI service failed to start${NC}"
    systemctl status giftus-ui
    exit 1
fi
echo ""

# Step 6: Verify all services
echo -e "${YELLOW}[6/6] Verifying all services...${NC}"
echo ""
echo "Service Status:"
echo "  API:   $(systemctl is-active giftus-api)"
echo "  UI:    $(systemctl is-active giftus-ui)"
echo "  Nginx: $(systemctl is-active nginx)"
echo "  DB:    $(systemctl is-active postgresql)"
echo ""

# Final summary
echo -e "${BLUE}========================================${NC}"
echo -e "${GREEN}✅ Deployment Complete!${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""
echo "Your application is live at:"
echo -e "${BLUE}  🌐 https://www.trophybazaar.in${NC}"
echo ""
echo "Quick test commands:"
echo "  curl https://www.trophybazaar.in/api/products"
echo "  curl https://www.trophybazaar.in/"
echo ""

#!/bin/bash

# Quick fix for Artifact Registry API issue

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔧 Fixing Artifact Registry API Issue${NC}"
echo "=================================================="

# Get project ID
read -p "Enter your Google Cloud Project ID: " PROJECT_ID

if [ -z "$PROJECT_ID" ]; then
    echo -e "${RED}❌ Project ID cannot be empty${NC}"
    exit 1
fi

# Set the project
gcloud config set project $PROJECT_ID

# Enable Artifact Registry API
echo -e "\n${YELLOW}Enabling Artifact Registry API...${NC}"
gcloud services enable artifactregistry.googleapis.com

echo -e "\n${YELLOW}Waiting for API to propagate (30 seconds)...${NC}"
sleep 30

echo -e "\n${GREEN}✅ Artifact Registry API enabled!${NC}"
echo -e "\n${YELLOW}💡 Now you can:${NC}"
echo "1. Re-run your GitHub Actions workflow"
echo "2. Or trigger a new deployment by pushing a commit"

echo -e "\n${GREEN}🚀 Your deployment should work now!${NC}"
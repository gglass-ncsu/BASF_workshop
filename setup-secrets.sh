#!/bin/bash

# BASF AI Workshop - Google Cloud Setup Script
# This script sets up the Google Cloud environment and stores the Claude API key securely

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 BASF AI Workshop - Google Cloud Setup${NC}"
echo "=================================================="

# Check if required tools are installed
echo -e "\n${YELLOW}Checking prerequisites...${NC}"

if ! command -v gcloud &> /dev/null; then
    echo -e "${RED}❌ Google Cloud CLI is not installed${NC}"
    echo "Please install it from: https://cloud.google.com/sdk/docs/install"
    exit 1
fi

if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker is not installed${NC}"
    echo "Please install Docker from: https://docs.docker.com/get-docker/"
    exit 1
fi

echo -e "${GREEN}✅ Prerequisites check passed${NC}"

# Get project ID
echo -e "\n${YELLOW}Setting up Google Cloud project...${NC}"
read -p "Enter your Google Cloud Project ID: " PROJECT_ID

if [ -z "$PROJECT_ID" ]; then
    echo -e "${RED}❌ Project ID cannot be empty${NC}"
    exit 1
fi

# Set the project
gcloud config set project $PROJECT_ID

# Enable required APIs
echo -e "\n${YELLOW}Enabling required Google Cloud APIs...${NC}"
gcloud services enable cloudbuild.googleapis.com
gcloud services enable run.googleapis.com
gcloud services enable secretmanager.googleapis.com
gcloud services enable containerregistry.googleapis.com

echo -e "${GREEN}✅ APIs enabled successfully${NC}"

# Get Claude API key
echo -e "\n${YELLOW}Setting up Claude API key...${NC}"
echo "Please enter your Claude API key (it will be stored securely in Google Secret Manager):"
read -s CLAUDE_API_KEY

if [ -z "$CLAUDE_API_KEY" ]; then
    echo -e "${RED}❌ Claude API key cannot be empty${NC}"
    exit 1
fi

# Create the secret
echo -e "\n${YELLOW}Creating secret in Google Secret Manager...${NC}"
echo "$CLAUDE_API_KEY" | gcloud secrets create claude-api-key --data-file=-

echo -e "${GREEN}✅ Claude API key stored securely${NC}"

# Build and deploy the application
echo -e "\n${YELLOW}Building and deploying the application...${NC}"

# Submit build to Cloud Build
gcloud builds submit --config cloudbuild.yaml .

echo -e "\n${GREEN}🎉 Deployment completed successfully!${NC}"

# Get the service URL
SERVICE_URL=$(gcloud run services describe basf-ai-workshop --region=us-central1 --format='value(status.url)')

echo -e "\n${BLUE}📋 Workshop Environment Details:${NC}"
echo "=================================================="
echo -e "🌐 Workshop URL: ${GREEN}$SERVICE_URL${NC}"
echo -e "🔑 API Key: ${GREEN}Stored securely in Google Secret Manager${NC}"
echo -e "📦 Container: ${GREEN}gcr.io/$PROJECT_ID/basf-ai-workshop${NC}"
echo -e "🌍 Region: ${GREEN}us-central1${NC}"

echo -e "\n${YELLOW}💡 Next Steps:${NC}"
echo "1. Share the workshop URL with participants"
echo "2. Test the environment by visiting the URL"
echo "3. Each participant can now use the workshop templates"

echo -e "\n${GREEN}✅ Setup complete! Your BASF AI Workshop is ready.${NC}"
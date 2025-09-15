#!/bin/bash

# BASF AI Workshop - GitHub CI/CD Setup Script
# This script sets up service accounts and permissions for GitHub Actions deployment

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔧 BASF AI Workshop - GitHub CI/CD Setup${NC}"
echo "=================================================="

# Check if gcloud is installed
if ! command -v gcloud &> /dev/null; then
    echo -e "${RED}❌ Google Cloud CLI is not installed${NC}"
    echo "Please install it from: https://cloud.google.com/sdk/docs/install"
    exit 1
fi

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
echo -e "\n${YELLOW}Enabling required APIs...${NC}"
gcloud services enable cloudbuild.googleapis.com
gcloud services enable run.googleapis.com
gcloud services enable secretmanager.googleapis.com
gcloud services enable containerregistry.googleapis.com
gcloud services enable iam.googleapis.com

# Create service account for GitHub Actions
SERVICE_ACCOUNT_NAME="github-actions-deploy"
SERVICE_ACCOUNT_EMAIL="${SERVICE_ACCOUNT_NAME}@${PROJECT_ID}.iam.gserviceaccount.com"

echo -e "\n${YELLOW}Creating service account for GitHub Actions...${NC}"

# Check if service account already exists
if gcloud iam service-accounts describe $SERVICE_ACCOUNT_EMAIL >/dev/null 2>&1; then
    echo -e "${YELLOW}⚠️  Service account already exists. Using existing account.${NC}"
else
    gcloud iam service-accounts create $SERVICE_ACCOUNT_NAME \
        --display-name="GitHub Actions Deployment" \
        --description="Service account for deploying BASF AI Workshop from GitHub Actions"
fi

# Grant necessary roles to the service account
echo -e "\n${YELLOW}Granting IAM roles...${NC}"

ROLES=(
    "roles/run.admin"
    "roles/storage.admin" 
    "roles/secretmanager.secretAccessor"
    "roles/cloudbuild.builds.editor"
    "roles/viewer"
    "roles/iam.serviceAccountUser"
)

for role in "${ROLES[@]}"; do
    echo "Granting $role..."
    gcloud projects add-iam-policy-binding $PROJECT_ID \
        --member="serviceAccount:$SERVICE_ACCOUNT_EMAIL" \
        --role="$role"
done

# Create and download service account key
echo -e "\n${YELLOW}Creating service account key...${NC}"
KEY_FILE="github-actions-key.json"

gcloud iam service-accounts keys create $KEY_FILE \
    --iam-account=$SERVICE_ACCOUNT_EMAIL

echo -e "${GREEN}✅ Service account key created: $KEY_FILE${NC}"

# Setup Claude API secret (if not already exists)
echo -e "\n${YELLOW}Setting up Claude API key secret...${NC}"

if gcloud secrets describe claude-api-key >/dev/null 2>&1; then
    echo -e "${YELLOW}⚠️  Claude API key secret already exists.${NC}"
else
    echo "Please enter your Claude API key:"
    read -s CLAUDE_API_KEY
    
    if [ -z "$CLAUDE_API_KEY" ]; then
        echo -e "${RED}❌ Claude API key cannot be empty${NC}"
        exit 1
    fi
    
    echo "$CLAUDE_API_KEY" | gcloud secrets create claude-api-key --data-file=-
    echo -e "${GREEN}✅ Claude API key stored in Secret Manager${NC}"
fi

# Display setup instructions
echo -e "\n${BLUE}📋 GitHub Repository Setup Instructions${NC}"
echo "=================================================="
echo -e "${GREEN}1. Push your code to GitHub:${NC}"
echo "   git init"
echo "   git add ."
echo "   git commit -m \"Initial commit: BASF AI Workshop\""
echo "   git branch -M main"
echo "   git remote add origin https://github.com/YOUR_USERNAME/basf-ai-workshop.git"
echo "   git push -u origin main"

echo -e "\n${GREEN}2. Add the following secrets to your GitHub repository:${NC}"
echo "   Go to: Settings > Secrets and variables > Actions"
echo ""
echo -e "   ${YELLOW}GCP_PROJECT_ID:${NC}"
echo "   $PROJECT_ID"
echo ""
echo -e "   ${YELLOW}GCP_SERVICE_ACCOUNT_KEY:${NC}"
echo "   Copy the entire contents of: $KEY_FILE"
echo ""

# Show the service account key content
echo -e "${YELLOW}📄 Service Account Key (copy this to GitHub secrets):${NC}"
echo "=================================================="
cat $KEY_FILE
echo "=================================================="

echo -e "\n${GREEN}3. GitHub Actions Features:${NC}"
echo "   ✅ Automatic deployment on push to main branch"
echo "   ✅ Preview environments for pull requests"  
echo "   ✅ Automatic cleanup of preview environments"
echo "   ✅ Security scanning and testing"

echo -e "\n${GREEN}4. Deployment Branches:${NC}"
echo "   • ${YELLOW}main${NC}: Automatically deploys to production"
echo "   • ${YELLOW}Pull Requests${NC}: Creates preview environments"

echo -e "\n${YELLOW}💡 Next Steps:${NC}"
echo "1. Create a GitHub repository for your workshop"
echo "2. Add the secrets shown above to your GitHub repository"
echo "3. Push your code - deployment will happen automatically!"
echo "4. Create pull requests to test preview environments"

echo -e "\n${RED}🔒 Security Note:${NC}"
echo "Keep the service account key ($KEY_FILE) secure and delete it after adding to GitHub secrets."

echo -e "\n${GREEN}✅ GitHub CI/CD setup complete!${NC}"

# Cleanup reminder
echo -e "\n${YELLOW}⚠️  Remember to delete the key file after adding to GitHub:${NC}"
echo "rm $KEY_FILE"
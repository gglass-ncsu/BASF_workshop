#!/bin/bash

# Fix public access for BASF AI Workshop when organization policies prevent automatic setup

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔧 Fixing Public Access for BASF AI Workshop${NC}"
echo "=================================================="

# Get project ID and service info
read -p "Enter your Google Cloud Project ID: " PROJECT_ID
SERVICE_NAME="basf-ai-workshop"
REGION="us-central1"

if [ -z "$PROJECT_ID" ]; then
    echo -e "${RED}❌ Project ID cannot be empty${NC}"
    exit 1
fi

# Set the project
gcloud config set project $PROJECT_ID

echo -e "\n${YELLOW}Option 1: Try setting public access directly${NC}"
if gcloud run services add-iam-policy-binding $SERVICE_NAME \
    --region=$REGION \
    --member="allUsers" \
    --role="roles/run.invoker"; then
    echo -e "${GREEN}✅ Public access enabled successfully!${NC}"
    
    # Get the service URL
    URL=$(gcloud run services describe $SERVICE_NAME --region=$REGION --format='value(status.url)')
    echo -e "\n${GREEN}🌐 Your workshop is now publicly accessible at:${NC}"
    echo -e "${BLUE}$URL${NC}"
    exit 0
fi

echo -e "\n${YELLOW}Option 2: Alternative access methods${NC}"
echo "Since organization policies prevent public access, here are alternatives:"

echo -e "\n${YELLOW}A. Authenticated Access (Recommended for Enterprise)${NC}"
echo "1. Share the service URL with participants"
echo "2. Participants must be authenticated with Google Cloud"
echo "3. Add participants to your project with Cloud Run Invoker role:"
echo "   gcloud projects add-iam-policy-binding $PROJECT_ID \\"
echo "     --member='user:participant@company.com' \\"
echo "     --role='roles/run.invoker'"

echo -e "\n${YELLOW}B. Domain-Restricted Access${NC}"
echo "1. Allow access for your organization's domain:"
echo "   gcloud run services add-iam-policy-binding $SERVICE_NAME \\"
echo "     --region=$REGION \\"
echo "     --member='domain:yourcompany.com' \\"
echo "     --role='roles/run.invoker'"

echo -e "\n${YELLOW}C. Service Account Access${NC}"
echo "1. Create a service account for workshop access"
echo "2. Generate keys for participants"
echo "3. Use service account authentication"

echo -e "\n${YELLOW}D. Load Balancer with IAP (Advanced)${NC}"
echo "1. Set up Google Cloud Load Balancer"
echo "2. Configure Identity-Aware Proxy (IAP)"
echo "3. Control access through IAP policies"

# Get current service URL anyway
URL=$(gcloud run services describe $SERVICE_NAME --region=$REGION --format='value(status.url)' 2>/dev/null || echo "Service not found")

echo -e "\n${BLUE}📋 Current Service Information:${NC}"
echo "=================================================="
echo -e "🌐 Service URL: $URL"
echo -e "📍 Region: $REGION"
echo -e "🏷️ Service Name: $SERVICE_NAME"
echo -e "🔒 Access: Requires authentication"

echo -e "\n${YELLOW}💡 Recommendation for Workshop:${NC}"
echo "For a BASF internal workshop, use option A (Authenticated Access)"
echo "This provides security while allowing easy access for participants."

echo -e "\n${GREEN}✅ Setup guidance complete!${NC}"
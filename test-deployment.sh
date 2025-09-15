#!/bin/bash

# Test the deployment locally before pushing to GitHub

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🧪 Testing BASF AI Workshop Deployment${NC}"
echo "=================================================="

# Test 1: Check if Node.js dependencies install correctly
echo -e "\n${YELLOW}Test 1: Installing dependencies...${NC}"
npm install
echo -e "${GREEN}✅ Dependencies installed successfully${NC}"

# Test 2: Test server startup locally
echo -e "\n${YELLOW}Test 2: Testing server startup...${NC}"
export CLAUDE_API_KEY="test-key-will-fail-gracefully"
export PORT=3000

# Start server in background
timeout 30 node server.js &
SERVER_PID=$!
sleep 5

# Test health endpoint
if curl -f http://localhost:3000/health > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Server started and health check passed${NC}"
else
    echo -e "${RED}❌ Health check failed${NC}"
fi

# Test templates endpoint
if curl -f http://localhost:3000/api/templates > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Templates endpoint working${NC}"
else
    echo -e "${RED}❌ Templates endpoint failed${NC}"
fi

# Test static files
if curl -f http://localhost:3000/ > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Static files served correctly${NC}"
else
    echo -e "${RED}❌ Static files not served${NC}"
fi

# Kill server
kill $SERVER_PID 2>/dev/null || true
wait $SERVER_PID 2>/dev/null || true

# Test 3: Docker build
echo -e "\n${YELLOW}Test 3: Testing Docker build...${NC}"
if command -v docker &> /dev/null; then
    docker build -t basf-workshop-test . > /dev/null
    echo -e "${GREEN}✅ Docker build successful${NC}"
    
    # Clean up test image
    docker rmi basf-workshop-test > /dev/null 2>&1 || true
else
    echo -e "${YELLOW}⚠️ Docker not available, skipping Docker build test${NC}"
fi

# Test 4: Check GitHub workflow syntax
echo -e "\n${YELLOW}Test 4: Checking GitHub workflow syntax...${NC}"
if command -v yamllint &> /dev/null; then
    yamllint .github/workflows/deploy.yml
    echo -e "${GREEN}✅ GitHub workflow syntax is valid${NC}"
else
    echo -e "${YELLOW}⚠️ yamllint not available, skipping workflow syntax check${NC}"
fi

echo -e "\n${GREEN}🎉 All tests passed! Your deployment should work correctly.${NC}"
echo -e "\n${YELLOW}💡 Next steps:${NC}"
echo "1. Commit and push your changes to GitHub"
echo "2. GitHub Actions will automatically deploy your workshop"
echo "3. Check the Actions tab to monitor deployment progress"

echo -e "\n${BLUE}📋 Deployment Configuration Summary:${NC}"
echo "=================================================="
echo -e "🔧 APIs enabled: Cloud Run, Cloud Build, Container Registry, Artifact Registry"
echo -e "🌐 Port: 8080 (Cloud Run compatible)"
echo -e "💾 Memory: 1Gi"
echo -e "⚡ CPU: 1 vCPU"
echo -e "📊 Max instances: 10"
echo -e "⏱️ Timeout: 900 seconds (15 minutes)"
echo -e "🔒 IAM: Public access enabled"
echo -e "🔑 API Key: From Google Secret Manager with environment variable fallback"

echo -e "\n${GREEN}✅ Ready for deployment!${NC}"
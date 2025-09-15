#!/bin/bash

# Debug script to test container locally with Cloud Run environment

echo "🔍 Testing container with Cloud Run environment variables..."

# Build the Docker image
echo "Building Docker image..."
docker build -t basf-workshop-debug .

# Run container with Cloud Run environment
echo "Starting container with Cloud Run settings..."
docker run -d \
  --name basf-debug \
  -p 8080:8080 \
  -e PORT=8080 \
  -e PROJECT_ID="test-project" \
  -e CLAUDE_API_KEY="test-key" \
  basf-workshop-debug

# Wait for startup
sleep 10

# Test health endpoint
echo "Testing health endpoint..."
if curl -f http://localhost:8080/health; then
    echo -e "\n✅ Health check passed"
else
    echo -e "\n❌ Health check failed"
fi

# Show container logs
echo -e "\n📋 Container logs:"
docker logs basf-debug

# Test other endpoints
echo -e "\n🧪 Testing other endpoints..."
curl -f http://localhost:8080/ > /dev/null && echo "✅ Root endpoint working" || echo "❌ Root endpoint failed"
curl -f http://localhost:8080/api/templates > /dev/null && echo "✅ Templates endpoint working" || echo "❌ Templates endpoint failed"

# Cleanup
echo -e "\n🧹 Cleaning up..."
docker stop basf-debug
docker rm basf-debug
docker rmi basf-workshop-debug

echo -e "\n✅ Container test complete!"
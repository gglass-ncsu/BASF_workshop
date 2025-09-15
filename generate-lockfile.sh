#!/bin/bash

# Generate package-lock.json for the BASF AI Workshop

echo "🔧 Generating package-lock.json..."

# Remove package-lock.json from .gitignore temporarily
sed -i.bak '/package-lock.json/d' .gitignore

# Install dependencies to generate lock file
npm install

# Check if lock file was created
if [ -f "package-lock.json" ]; then
    echo "✅ package-lock.json generated successfully"
    echo "📝 You can now commit this file to your repository"
    echo ""
    echo "Next steps:"
    echo "1. git add package-lock.json"
    echo "2. git commit -m 'Add package-lock.json'"
    echo "3. git push"
else
    echo "❌ Failed to generate package-lock.json"
    exit 1
fi
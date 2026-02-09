#!/bin/bash

# Build script for Tidy AI
# This script builds the entire application for distribution

set -e

echo "🚀 Building Tidy AI..."

# Clean previous builds
echo "🧹 Cleaning previous builds..."
rm -rf dist bin .next

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Build Next.js app
echo "🏗️  Building Next.js app..."
npm run build:next

# Build CLI
echo "🔧 Building CLI..."
npm run build:cli

# Build Server
echo "⚙️  Building Server..."
npm run build:server

echo "✅ Build complete!"
echo ""
echo "📝 Next steps:"
echo "  - Test locally: npm link"
echo "  - Package binaries: npm run package"
echo "  - Publish to npm: npm publish"

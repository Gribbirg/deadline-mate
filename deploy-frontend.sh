#!/bin/bash

# Exit on error
set -e

echo "Deploying Deadline Mate Frontend..."

# Add swap if needed (only if not already added)
if [ $(free -m | grep Swap | awk '{print $2}') -eq 0 ]; then
  echo "Adding swap space to prevent memory issues..."
  sudo fallocate -l 2G /swapfile
  sudo chmod 600 /swapfile
  sudo mkswap /swapfile
  sudo swapon /swapfile
  echo "Swap added. Consider adding to fstab for persistence."
fi

# Navigate to frontend directory
cd /var/www/deadline-mate/frontend

# Install dependencies if needed
echo "Installing dependencies..."
npm ci --production

# Clear previous build if it exists
echo "Clearing previous build..."
rm -rf .next

# Build the application with increased memory
echo "Building the application..."
NODE_OPTIONS="--max-old-space-size=2048" npm run build

# Ensure BUILD_ID exists
if [ ! -f .next/BUILD_ID ]; then
  echo "BUILD_ID not found. Creating it..."
  echo "$(date +%s)" > .next/BUILD_ID
fi

# Restart the service
echo "Restarting the frontend service..."
sudo systemctl restart deadline-mate-frontend

echo "Deployment complete! Check service status with: sudo systemctl status deadline-mate-frontend" 
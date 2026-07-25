#!/bin/bash
set -e

echo "🚀 Fixing Docker installation..."

# Clean any broken repo

sudo rm -f /etc/apt/sources.list.d/docker.list

# Update

sudo apt-get update -y
sudo apt-get install -y ca-certificates curl gnupg

# Add Docker GPG key

sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | 
sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg

# Add Docker repo (FIXED SINGLE LINE)

echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu noble stable" | 
sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Update again

sudo apt-get update -y

# Install Docker

sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# Start Docker

sudo systemctl enable docker
sudo systemctl start docker

# Add user to docker group

sudo usermod -aG docker $USER

echo "⚠️ Run this after install: newgrp docker"

# Test

docker --version
docker compose version

echo "✅ Docker installed successfully!"
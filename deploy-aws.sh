#!/bin/bash
set -e

echo "====================================================="
echo "   SLOON / KUMBHAKARAN - AWS FREE TIER DEPLOYMENT    "
echo "====================================================="

# 1. Update OS packages
sudo apt-get update -y
sudo apt-get install -y curl git ufw

# 2. Install Docker if not present
if ! command -v docker &> /dev/null; then
    echo ">> Installing Docker..."
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    sudo usermod -aG docker $USER
    rm get-docker.sh
fi

# 3. Install Docker Compose plugin if not present
if ! docker compose version &> /dev/null; then
    echo ">> Installing Docker Compose plugin..."
    sudo apt-get install -y docker-compose-plugin
fi

# 4. Install Node 22 & pnpm for frontend build
if ! command -v node &> /dev/null; then
    echo ">> Installing Node.js 22 and pnpm..."
    curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
    sudo apt-get install -y nodejs
    sudo corepack enable
    sudo corepack prepare pnpm@latest --activate
fi

# 5. Build Frontend assets locally on EC2
echo ">> Installing dependencies and building production frontend..."
pnpm install
pnpm run build

# 6. Configure Firewall (UFW)
echo ">> Opening ports 22, 80, 443..."
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw --force enable

# 7. Start Backend & Caddy Reverse Proxy
echo ">> Launching Docker containers (Backend + Caddy)..."
docker compose -f docker-compose.aws.yml down --remove-orphans || true
docker compose -f docker-compose.aws.yml up -d --build

echo "====================================================="
echo "   ✅ DEPLOYMENT FINISHED SUCCESSFULLY!             "
echo "   Backend: http://localhost:10000                   "
echo "   Web App: http://$(curl -s ifconfig.me)            "
echo "====================================================="

# 🚀 SLOON — AWS FREE TIER DEPLOYMENT GUIDE (100% FREE)

This guide shows you how to host SLOON on **AWS Free Tier** for **$0/month**.

---

## 💡 The Best Architecture for AWS Free Tier

| Component | AWS Free Tier Service | Cost | Why it's the best option |
| :--- | :--- | :---: | :--- |
| **Server & Backend** | **AWS EC2 (`t2.micro` or `t3.micro`)** | **$0** (750 hrs/mo free for 12 mos) | Runs your NestJS + Fastify backend + Caddy web server 24/7 without exceeding limits. |
| **Web Server / SSL** | **Caddy (Reverse Proxy)** | **$0** | Automatic HTTPS (free Let's Encrypt certificates), routes `/api` to backend and serves frontend SPA. |
| **Database** | **Supabase PostgreSQL (or AWS RDS)** | **$0** (Permanently Free on Supabase) | **Recommended**: Keep Supabase Free Tier because it has PostGIS pre-installed, automatic backups, and is 100% free forever (AWS RDS Free Tier ends after 12 months). |
| **Static CDN (Optional)**| **AWS CloudFront** | **$0** (1 TB/mo data transfer always free) | Super-fast caching across global edge locations. |

> [!NOTE]
> **Why not AWS App Runner or ECS Fargate?**  
> App Runner and ECS Fargate are NOT part of the AWS Free Tier — they start billing hourly per vCPU/RAM ($25–$50+/month). A single **EC2 `t2.micro`** instance is 100% Free for 750 hours every month.

---

## 🛠️ Step-by-Step AWS Setup Instructions

### Step 1: Launch an AWS EC2 Free Tier Instance

1. Log into your [AWS Management Console](https://console.aws.amazon.com/).
2. In the top search bar, type **EC2** and select **EC2**.
3. Click the orange **"Launch Instance"** button.
4. Fill in the following settings:
   - **Name**: `sloon-production`
   - **OS Image**: Select **Ubuntu** (Ubuntu Server 24.04 LTS or 22.04 LTS - *Free tier eligible*).
   - **Instance Type**: Select **`t2.micro`** (or **`t3.micro`** if `t2` is unavailable in your region) — *Free tier eligible*.
   - **Key pair (login)**: Click **"Create new key pair"**, name it `sloon-key`, download the `.pem` file to your computer.
   - **Network settings**:
     - Check **"Allow SSH traffic from Anywhere (0.0.0.0/0)"**
     - Check **"Allow HTTP traffic from the internet"**
     - Check **"Allow HTTPS traffic from the internet"**
   - **Configure Storage**: Leave at **8 GiB gp3** or **20 GiB gp3** (AWS Free Tier includes up to 30 GiB EBS storage free!).
5. Click **"Launch Instance"**.

---

### Step 2: Connect to Your EC2 Server

From your terminal (macOS/Linux or PowerShell on Windows):

```bash
# 1. Set permission on your downloaded key (Linux/macOS)
chmod 400 sloon-key.pem

# 2. SSH into your EC2 instance (replace with your EC2 Public IPv4)
ssh -i sloon-key.pem ubuntu@YOUR_EC2_PUBLIC_IP
```

*(Alternatively: You can use the browser-based **"EC2 Instance Connect"** button directly inside AWS Console without downloading any keys!)*

---

### Step 3: Clone Repository and Configure `.env`

Once connected to your EC2 instance, run:

```bash
# 1. Clone your repository
git clone https://github.com/Rationalcodes/project_1.git sloon
cd sloon

# 2. Create the backend environment file
nano backend/.env
```

Paste your production secrets into `backend/.env`:
```env
PORT=10000
NODE_ENV=production
DATABASE_URL=your_supabase_or_rds_connection_string
JWT_SECRET=sloon_super_secret_production_key_minimum_32_characters_here
GOOGLE_CLIENT_ID=your_google_client_id_here
```
*(Press `Ctrl+O` then `Enter` to save, and `Ctrl+X` to exit nano)*.

---

### Step 4: Run the Automated Deployment Script

We have provided a one-click deployment script:

```bash
chmod +x deploy-aws.sh
./deploy-aws.sh
```

This script automatically:
1. Installs Docker, Docker Compose, Node.js 22, and pnpm.
2. Builds the frontend production bundle (`dist/`).
3. Opens the firewall on ports 80, 443, and 22.
4. Starts the backend container and Caddy reverse proxy via Docker Compose.

---

### Step 5: Verify Your Live Site

Open your browser and visit:
```text
http://YOUR_EC2_PUBLIC_IP
```
You will see your live SLOON application running smoothly!

---

### Step 6: Attach Your Domain & Enable Automatic Free HTTPS (SSL)

When you are ready to point your domain (e.g., `sloon.in` or `api.sloon.in`):

1. Go to your DNS provider (GoDaddy, Namecheap, Route 53, Cloudflare).
2. Add an **A Record**:
   - Host: `@` (or subdomain like `app`)
   - Value: `YOUR_EC2_PUBLIC_IP`
3. Edit `Caddyfile` on your EC2 instance:
   ```bash
   nano Caddyfile
   ```
   Replace `:80` with your domain:
   ```caddyfile
   sloon.in, www.sloon.in {
       handle /api/* {
           reverse_proxy backend:10000
       }

       handle /socket.io/* {
           reverse_proxy backend:10000
       }

       handle {
           root * /srv/frontend
           try_files {path} /index.html
           file_server
       }

       encode zstd gzip
   }
   ```
4. Restart Caddy:
   ```bash
   docker compose -f docker-compose.aws.yml restart caddy
   ```
Caddy will automatically request and install a free SSL certificate from Let's Encrypt!

---

## 🔄 How to Deploy Updates in the Future

Whenever you push new changes to GitHub:

```bash
cd ~/sloon
git pull origin main
pnpm run build
docker compose -f docker-compose.aws.yml restart
```
Zero downtime, fast, and completely free on AWS!

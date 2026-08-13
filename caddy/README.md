# Quick Caddy Setup for Azure VM & Custom Domain

Caddy automatically handles HTTPS/SSL certificate provisioning (via Let's Encrypt) with zero extra setup or cron jobs!

---

## 3-Step Setup on Azure Ubuntu VM

### 1. Install Caddy
Run these commands on your Azure VM SSH terminal:

```bash
sudo apt install -y debian-keyring debian-archive-keyring apt-transport-https curl
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | sudo tee /etc/apt/sources.list.d/caddy-stable.list
sudo apt update
sudo apt install caddy
```

### 2. Copy the Caddyfile
Replace `/etc/caddy/Caddyfile` with your project's `Caddyfile`:

```bash
sudo cp caddy/Caddyfile /etc/caddy/Caddyfile
```

Update your domain name in `/etc/caddy/Caddyfile`:
```bash
sudo nano /etc/caddy/Caddyfile
```

### 3. Reload Caddy
```bash
sudo systemctl reload caddy
```

---

## DNS & Firewall Checklist
1. Point your domain **A Record** to your Azure VM Public IP.
2. Ensure Azure Network Security Group allows inbound traffic on **Port 80** and **Port 443**.
3. Caddy will automatically issue and install SSL certificates in seconds!

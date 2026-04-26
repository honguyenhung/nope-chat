# 🛡️ Security & DDoS Protection

## Overview

AnonChat includes multiple layers of protection against DDoS attacks and abuse:

## Protection Layers

### 1. **Connection Limits**
- Max 5 concurrent connections per IP
- Automatic IP banning after 10 violations in 5 minutes
- 1-hour automatic ban duration

### 2. **Rate Limiting**
- **Messages**: 30 per 10 seconds per socket
- **Events**: 60 per minute per socket (join_room, typing, etc.)
- **HTTP API**: 100 requests per 15 minutes per IP

### 3. **Input Validation**
- Public key format validation (base64, max 200 chars)
- Message size limits (20KB encrypted content, 4MB images)
- Room ID sanitization

### 4. **Socket.IO Hardening**
- WebSocket-only transport (no polling)
- 60s ping timeout
- 10s upgrade timeout
- Disabled legacy Engine.IO v3

### 5. **Monitoring & Alerts**
- Real-time connection/message rate monitoring
- Console alerts for suspicious activity
- Admin API for statistics

## Configuration

Set these environment variables in `.env`:

```bash
# Security
ADMIN_KEY=your-secret-admin-key-here
MAX_CONNECTIONS_PER_IP=5
MAX_VIOLATIONS_BEFORE_BAN=10
BAN_DURATION_MINUTES=60

# Rate Limits
MESSAGE_RATE_LIMIT=30
MESSAGE_RATE_WINDOW_SECONDS=10
EVENT_RATE_LIMIT=60
```

## Admin API

Protect your server with the admin API:

```bash
# Ban an IP
curl -X POST http://localhost:3001/api/admin/ban-ip \
  -H "Authorization: Bearer your-admin-key" \
  -H "Content-Type: application/json" \
  -d '{"ip": "192.168.1.100"}'

# Unban an IP
curl -X POST http://localhost:3001/api/admin/unban-ip \
  -H "Authorization: Bearer your-admin-key" \
  -H "Content-Type: application/json" \
  -d '{"ip": "192.168.1.100"}'

# Check server stats
curl http://localhost:3001/api/admin/stats \
  -H "Authorization: Bearer your-admin-key"
```

## Testing Protection

Run the DDoS test (only on your own server):

```bash
node test-ddos.js
```

This will:
- Attempt 20 connections (should be limited to 5)
- Spam messages and events
- Trigger rate limits and IP bans

## Production Deployment

### Reverse Proxy (Recommended)

Use nginx or Cloudflare for additional protection:

```nginx
# nginx.conf
upstream anonchat {
    server localhost:3001;
}

server {
    listen 80;
    server_name your-domain.com;
    
    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    limit_req_zone $binary_remote_addr zone=ws:10m rate=5r/s;
    
    location /api/ {
        limit_req zone=api burst=20 nodelay;
        proxy_pass http://anonchat;
    }
    
    location /socket.io/ {
        limit_req zone=ws burst=10 nodelay;
        proxy_pass http://anonchat;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

### Cloudflare (Easy Option)

1. Enable Cloudflare proxy (orange cloud)
2. Set Security Level to "High"
3. Enable "Under Attack Mode" if needed
4. Configure rate limiting rules

### Firewall Rules

```bash
# Allow only necessary ports
ufw allow 22    # SSH
ufw allow 80    # HTTP
ufw allow 443   # HTTPS
ufw deny 3001   # Block direct access to Node.js

# Rate limiting with iptables
iptables -A INPUT -p tcp --dport 80 -m limit --limit 25/minute --limit-burst 100 -j ACCEPT
```

## Monitoring

Watch logs for these patterns:

```bash
# High connection rate
🚨 HIGH CONNECTION RATE: 150 connections/minute

# IP violations
⚠️  IP 192.168.1.100 violation (message_spam): 8/10

# IP bans
🔨 IP 192.168.1.100 banned for 60 minutes
```

## Emergency Response

If under attack:

1. **Enable "Under Attack Mode"** (if using Cloudflare)
2. **Lower rate limits** temporarily
3. **Check admin stats**: `GET /api/admin/stats`
4. **Ban attacking IPs**: `POST /api/admin/ban-ip`
5. **Restart server** if memory usage is high

## Additional Recommendations

- Use a CDN (Cloudflare, AWS CloudFront)
- Deploy behind a load balancer
- Monitor server resources (CPU, memory, network)
- Set up log aggregation (ELK stack, Datadog)
- Consider Redis for distributed rate limiting
- Implement CAPTCHA for suspicious IPs
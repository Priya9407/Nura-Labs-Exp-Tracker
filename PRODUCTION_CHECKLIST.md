# Production Code Changes Checklist

This document outlines all the code changes needed to deploy your Flask + React app to production.

## 1. Environment Variables (.env file)

### Backend `.env`

```bash
# Database - Change from localhost to production MongoDB
MONGODB_URL=mongodb://your-mongodb-host:27017/experiment_platform
# OR with auth:
# MONGODB_URL=mongodb://username:password@your-mongodb-host:27017/experiment_platform?authSource=admin

# Redis - Change from localhost to production Redis
REDIS_URL=redis://your-redis-host:6379/0
# OR with auth:
# REDIS_URL=redis://:password@your-redis-host:6379/0

# Session - Use a strong random secret
SESSION_SECRET=your-super-secret-production-key-min-32-chars-long

# SMTP Configuration - Use production email service
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_EMAIL=your-production-email@gmail.com
SMTP_PASSWORD=your-app-password

# URLs - Change from localhost to production
FRONTEND_URL=https://yourdomain.com
BACKEND_URL=https://api.yourdomain.com

# Environment
FLASK_ENV=production
FLASK_PORT=5000

# Admin setup - Use strong password
ADMIN_EMAIL=admin@yourdomain.com
ADMIN_NAME=Admin User
ADMIN_PASSWORD=your-strong-admin-password
```

### Frontend `.env.production`

```bash
# API URL - Point to production backend
VITE_API_URL=https://api.yourdomain.com/api

# App info
VITE_APP_NAME=YourApp
VITE_APP_VERSION=1.0.0
VITE_ENABLE_ANALYTICS=true
```

---

## 2. Flask App Changes (backend/app.py)

### Remove/Comment Debug Lines

```python
# Remove or comment out these lines in production:

# Lines 41-45 - Remove debug route printing
# print("\nRegistered Routes:")
# for rule in app.url_map.iter_rules():
#     if rule.endpoint != 'static':
#         print(f"  {rule.rule} [{','.join(rule.methods - {'OPTIONS', 'HEAD'})}] -> {rule.endpoint}")
# print()

# Lines 107-114 - Remove test endpoint
# @app.route('/api/test')
# def test_endpoint():
#     ...
```

### Update CORS for Production

```python
# In production, restrict CORS to your domain:
CORS(app, supports_credentials=True, origins=[
    'https://yourdomain.com',
    'https://www.yourdomain.com'
])

# Instead of:
# CORS(app, supports_credentials=True, origins=[Config.FRONTEND_URL])
```

### Use Production WSGI Server

```python
# Replace the __main__ block (lines 147-152):

if __name__ == '__main__':
    # Development only - DON'T USE IN PRODUCTION
    app.run(host='0.0.0.0', port=Config.FLASK_PORT, debug=False)

# For production, use gunicorn:
# gunicorn -w 4 -b 0.0.0.0:5000 --access-logfile - --error-logfile - app:app
```

---

## 3. MongoDB Connection (backend/models/user.py and experiment.py)

### Add Connection Pooling

```python
from pymongo import MongoClient
from config.settings import Config

# Add connection options for production
client = MongoClient(
    Config.MONGODB_URL,
    maxPoolSize=50,          # Maximum connections in pool
    minPoolSize=10,          # Minimum connections in pool
    maxIdleTimeMS=45000,     # Close idle connections after 45s
    waitQueueTimeoutMS=5000, # Timeout for waiting for connection
    serverSelectionTimeoutMS=5000,
    retryWrites=True,
    w='majority'             # Write concern
)

db = client.get_default_database()
```

---

## 4. Redis Connection (backend/services/redis_service.py)

### Add Production Connection Options

```python
import redis
from config.settings import Config

class RedisService:
    def __init__(self):
        self.client = redis.from_url(
            Config.REDIS_URL,
            decode_responses=True,
            socket_connect_timeout=5,    # Connection timeout
            socket_timeout=5,             # Operation timeout
            health_check_interval=30,     # Health check every 30s
            max_connections=50            # Connection pool size
        )
```

---

## 5. Security Headers (Add to app.py)

```python
from flask import Flask, send_from_directory, jsonify, request, after_this_request

@app.after_request
def add_security_headers(response):
    """Add security headers to all responses."""
    # Prevent MIME sniffing
    response.headers['X-Content-Type-Options'] = 'nosniff'
    # Prevent clickjacking
    response.headers['X-Frame-Options'] = 'SAMEORIGIN'
    # XSS Protection
    response.headers['X-XSS-Protection'] = '1; mode=block'
    # Referrer Policy
    response.headers['Referrer-Policy'] = 'strict-origin-when-cross-origin'
    # Content Security Policy (customize as needed)
    response.headers['Content-Security-Policy'] = "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline';"
    # Strict Transport Security (HTTPS only)
    # response.headers['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains'
    return response
```

---

## 6. Rate Limiting (backend/middleware/rate_limit.py)

### Update Rate Limits for Production

```python
# In config/settings.py, adjust these:
RATE_LIMIT_DEFAULT = 60      # requests per minute (was 100)
RATE_LIMIT_AUTH = 5          # keep as is
RATE_LIMIT_SENSITIVE = 10    # keep as is
```

---

## 7. Frontend API Client

### Update API Client for Production

```javascript
// frontend/src/api/client.js or similar

// Development:
const API_BASE_URL = 'http://localhost:5000/api';

// Production:
const API_BASE_URL = 'https://api.yourdomain.com/api';
// OR use environment variable:
const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';
```

---

## 8. Logging Configuration

### Add to backend/config/settings.py

```python
import logging
from logging.handlers import RotatingFileHandler
import os

# Production logging
def configure_logging(app):
    """Configure production logging."""
    if not os.path.exists('logs'):
        os.mkdir('logs')
    
    file_handler = RotatingFileHandler(
        'logs/app.log',
        maxBytes=10240000,  # 10MB
        backupCount=10
    )
    file_handler.setFormatter(logging.Formatter(
        '%(asctime)s %(levelname)s: %(message)s [in %(pathname)s:%(lineno)d]'
    ))
    file_handler.setLevel(logging.INFO)
    app.logger.addHandler(file_handler)
    app.logger.setLevel(logging.INFO)
    app.logger.info('Application startup')
```

---

## 9. Database Indexes

### Ensure Indexes Exist (add to models)

```python
# backend/models/user.py - add at the end

# Create indexes for production performance
def ensure_indexes():
    """Ensure database indexes exist."""
    # User indexes
    db.users.create_index('email', unique=True)
    db.users.create_index('uuid', unique=True)
    db.users.create_index('role')
    db.users.create_index('is_active')
    
    # Experiment indexes
    db.experiments.create_index('uuid', unique=True)
    db.experiments.create_index('exp_no')
    db.experiments.create_index('owner')
    db.experiments.create_index('status')
    db.experiments.create_index('current_phase')
    db.experiments.create_index('created_at')
    db.experiments.create_index([('owner', 1), ('created_at', -1)])
    db.experiments.create_index([('status', 1), ('current_phase', 1)])
```

---

## 10. Health Check Endpoint

### Add Production Health Check

```python
@app.route('/api/health')
def health_check():
    """Production health check with dependency status."""
    health = {
        'status': 'healthy',
        'timestamp': datetime.now().isoformat(),
        'version': '1.0.0',
        'dependencies': {}
    }
    
    # Check MongoDB
    try:
        # Ping MongoDB
        client.admin.command('ping')
        health['dependencies']['mongodb'] = 'connected'
    except Exception as e:
        health['dependencies']['mongodb'] = f'error: {str(e)}'
        health['status'] = 'unhealthy'
    
    # Check Redis
    try:
        redis_service.client.ping()
        health['dependencies']['redis'] = 'connected'
    except Exception as e:
        health['dependencies']['redis'] = f'error: {str(e)}'
        health['status'] = 'unhealthy'
    
    status_code = 200 if health['status'] == 'healthy' else 503
    return jsonify(health), status_code
```

---

## 11. Gunicorn Configuration (create gunicorn.conf.py)

```python
# gunicorn.conf.py
import multiprocessing
import os

# Server socket
bind = "0.0.0.0:5000"

# Worker processes
workers = multiprocessing.cpu_count() * 2 + 1
worker_class = "sync"
worker_connections = 1000

# Timeout
timeout = 30
keepalive = 2

# Logging
accesslog = "-"  # Log to stdout
errorlog = "-"   # Log to stderr
loglevel = "info"
access_log_format = '%(h)s %(l)s %(u)s %(t)s "%(r)s" %(s)s %(b)s "%(f)s" "%(a)s" %(D)s'

# Process naming
proc_name = 'experiment_platform'

# Server mechanics
daemon = False
pidfile = '/tmp/gunicorn.pid'

# SSL (if terminating at Gunicorn)
# keyfile = "/path/to/key.pem"
# certfile = "/path/to/cert.pem"
```

---

## 12. Docker Compose (optional but recommended)

```yaml
# docker-compose.prod.yml
version: '3.8'

services:
  app:
    build: .
    restart: always
    ports:
      - "5000:5000"
    environment:
      - FLASK_ENV=production
      - MONGODB_URL=mongodb://mongo:27017/experiment_platform
      - REDIS_URL=redis://redis:6379/0
    depends_on:
      - mongo
      - redis
    networks:
      - app-network

  mongo:
    image: mongo:6
    restart: always
    volumes:
      - mongo_data:/data/db
    networks:
      - app-network

  redis:
    image: redis:7-alpine
    restart: always
    volumes:
      - redis_data:/data
    networks:
      - app-network

  nginx:
    image: nginx:alpine
    restart: always
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - ./frontend/dist:/usr/share/nginx/html:ro
    depends_on:
      - app
    networks:
      - app-network

volumes:
  mongo_data:
  redis_data:

networks:
  app-network:
    driver: bridge
```

---

## 13. Quick Checklist

### Backend Changes:

- [ ] Update `.env` with production URLs and secrets
- [ ] Remove debug print statements
- [ ] Update CORS origins to production domains
- [ ] Add security headers
- [ ] Configure MongoDB connection pooling
- [ ] Configure Redis connection pooling
- [ ] Set up production logging
- [ ] Create database indexes
- [ ] Update rate limits
- [ ] Test health check endpoint

### Frontend Changes:

- [ ] Update `.env.production` with production API URL
- [ ] Build for production: `npm run build`
- [ ] Test built files locally before deploying
- [ ] Verify all assets load correctly

### Server Setup:

- [ ] Install Python dependencies: `pip install -r requirements.txt`
- [ ] Install Gunicorn: `pip install gunicorn`
- [ ] Set up MongoDB (local or cloud)
- [ ] Set up Redis (local or cloud)
- [ ] Configure environment variables
- [ ] Configure Apache/Nginx as reverse proxy
- [ ] Set up SSL certificate
- [ ] Configure firewall (ufw/iptables)
- [ ] Set up log rotation
- [ ] Configure monitoring/health checks

### Deployment Command:

```bash
# Build frontend
cd frontend && npm run build && cd ..

# Copy frontend build to server
scp -r frontend/dist user@server:/var/www/your-app/

# Copy backend to server
scp -r backend user@server:/var/www/your-app/

# On server:
cd /var/www/your-app/backend
source venv/bin/activate

# Start with Gunicorn
gunicorn -c gunicorn.conf.py app:app

# Or use systemd service
sudo systemctl start your-app
```

---

## 14. Environment-Specific Files Structure

```
backend/
├── config/
│   ├── settings.py           # Main config (loads from env)
│   └── settings_prod.py     # Production overrides (optional)
├── .env                      # Local development
├── .env.production           # Production template
└── gunicorn.conf.py          # Gunicorn config

frontend/
├── .env                      # Local development
├── .env.production           # Production
└── dist/                     # Build output
```

# ==========================================
# Stage 1 - Build Frontend
# ==========================================
FROM node:20-alpine AS frontend-builder

WORKDIR /app/frontend

# Install dependencies
COPY frontend/package*.json ./
RUN npm ci

# Copy source
COPY frontend/ ./

# Build frontend
RUN npm run build

# ==========================================
# Stage 2 - Backend
# ==========================================
FROM python:3.12-slim

WORKDIR /app

# System dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Python dependencies
COPY backend/requirements.txt ./backend/
RUN pip install --no-cache-dir -r backend/requirements.txt

# Gunicorn
RUN pip install --no-cache-dir gunicorn

# Backend code
COPY backend/ ./backend/

# Frontend build from stage 1
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist

# Gunicorn config
COPY backend/gunicorn.conf.py ./

# Environment variables
ENV PYTHONPATH=/app
ENV FLASK_APP=backend/app.py
ENV FLASK_ENV=production

# Expose backend port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=30s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:3000/api/health || exit 1

# Start application
CMD ["gunicorn", "-c", "gunicorn.conf.py", "--bind", "0.0.0.0:3000", "backend.app:app"]